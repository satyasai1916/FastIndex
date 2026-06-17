#include <pybind11/pybind11.h>
#include <pybind11/stl.h>
#include "flashindex.cpp"

namespace py = pybind11;

PYBIND11_MODULE(flashindex_cpp, m) {
    m.doc() = "FlashIndex C++ search engine";

    py::class_<FlashIndexEngine>(m, "FlashIndexEngine")
        .def(py::init<>())
        .def("build", &FlashIndexEngine::build,
             py::arg("lines"),
             py::call_guard<py::gil_scoped_release>(),
             "Build inverted index from list of strings. Returns build time in ms.")
        .def("search", &FlashIndexEngine::search,
             py::arg("query"),
             py::call_guard<py::gil_scoped_release>(),
             "Search for query. Returns list of matching line numbers.")
        .def("get_line", &FlashIndexEngine::get_line,
             py::arg("line_id"),
             "Return text of line at given index.")
        .def("line_count", &FlashIndexEngine::line_count,
             "Number of lines in the index.")
        .def("clear", &FlashIndexEngine::clear,
             "Clear the index and stored lines.");
}
