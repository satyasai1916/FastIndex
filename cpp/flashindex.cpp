#pragma once
#include <algorithm>
#include <cctype>
#include <chrono>
#include <string>
#include <unordered_map>
#include <vector>

class FlashIndexEngine {
public:
    // Build inverted index from lines. Returns elapsed time in milliseconds.
    double build(const std::vector<std::string>& lines) {
        auto t0 = std::chrono::steady_clock::now();

        lines_ = lines;
        index_.clear();

        for (int i = 0; i < static_cast<int>(lines_.size()); ++i) {
            for (const auto& token : tokenize(lines_[i])) {
                index_[token].push_back(i);
            }
        }

        // Reduce memory overhead on large indexes
        for (auto& [key, vec] : index_) {
            vec.shrink_to_fit();
        }

        auto t1 = std::chrono::steady_clock::now();
        double elapsed_ms = std::chrono::duration<double, std::milli>(t1 - t0).count();
        return elapsed_ms;
    }

    // Search for query. Returns sorted list of matching line numbers.
    std::vector<int> search(const std::string& query) const {
        auto tokens = tokenize(query);
        if (tokens.empty()) {
            return {};
        }

        if (tokens.size() == 1) {
            auto it = index_.find(tokens[0]);
            if (it == index_.end()) return {};
            return it->second;
        }

        // Multi-token: start with shortest posting list, intersect
        std::sort(tokens.begin(), tokens.end(), [&](const std::string& a, const std::string& b) {
            auto ia = index_.find(a);
            auto ib = index_.find(b);
            size_t sa = (ia == index_.end()) ? 0 : ia->second.size();
            size_t sb = (ib == index_.end()) ? 0 : ib->second.size();
            return sa < sb;
        });

        auto first_it = index_.find(tokens[0]);
        if (first_it == index_.end()) return {};

        std::vector<int> result = first_it->second;
        for (size_t k = 1; k < tokens.size() && !result.empty(); ++k) {
            auto it = index_.find(tokens[k]);
            if (it == index_.end()) return {};

            std::vector<int> intersected;
            intersected.reserve(std::min(result.size(), it->second.size()));
            std::set_intersection(
                result.begin(), result.end(),
                it->second.begin(), it->second.end(),
                std::back_inserter(intersected)
            );
            result = std::move(intersected);
        }
        return result;
    }

    std::string get_line(int line_id) const {
        if (line_id < 0 || line_id >= static_cast<int>(lines_.size())) {
            return "";
        }
        return lines_[line_id];
    }

    int line_count() const {
        return static_cast<int>(lines_.size());
    }

    void clear() {
        lines_.clear();
        index_.clear();
    }

private:
    std::vector<std::string> lines_;
    std::unordered_map<std::string, std::vector<int>> index_;

    // Tokenize: lowercase + keep only [a-z0-9] runs (mirrors Python regex [a-z0-9]+)
    static std::vector<std::string> tokenize(const std::string& text) {
        std::vector<std::string> tokens;
        std::string current;
        for (unsigned char c : text) {
            char lc = static_cast<char>(std::tolower(c));
            if (std::isalnum(static_cast<unsigned char>(lc))) {
                current += lc;
            } else {
                if (!current.empty()) {
                    tokens.push_back(std::move(current));
                    current.clear();
                }
            }
        }
        if (!current.empty()) {
            tokens.push_back(std::move(current));
        }
        return tokens;
    }
};
