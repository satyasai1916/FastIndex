# Stage 1: compile C++ engine
FROM python:3.11-slim AS builder

RUN apt-get update && apt-get install -y \
    g++ \
    cmake \
    python3-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pybind11 via pip so cmake can locate it reliably
RUN pip install --no-cache-dir pybind11==2.13.6

COPY cpp/ /src/cpp/

WORKDIR /src/cpp/build

RUN cmake .. \
    -DCMAKE_BUILD_TYPE=Release \
    -DPYTHON_EXECUTABLE="$(which python3)" \
    -Dpybind11_DIR="$(python3 -m pybind11 --cmakedir)" \
    && make -j"$(nproc)"

# Stage 2: runtime
FROM python:3.11-slim

WORKDIR /app

COPY --from=builder /src/cpp/build/flashindex_cpp*.so /app/

COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY backend/app/ /app/app/

ENV DATA_DIR=/app/data
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
