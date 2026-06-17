cmake_minimum_required(VERSION 3.15)
project(flashindex_cpp CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Python3 REQUIRED COMPONENTS Interpreter Development)
find_package(pybind11 CONFIG REQUIRED)

pybind11_add_module(flashindex_cpp
    bindings.cpp
)

target_compile_options(flashindex_cpp PRIVATE -O3 -march=native -Wall)
