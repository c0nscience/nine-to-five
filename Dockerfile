# Build stage
FROM rust:1.90-slim AS builder

# Install build dependencies
RUN apt-get update && \
  apt-get install -y pkg-config libssl-dev && \
  rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy source to cache dependencies
RUN mkdir src && \
  echo "fn main() {}" > src/main.rs && \
  cargo build --release && \
  rm -rf src target/release/deps/*nine-to-five*

# Copy source code
COPY .sqlx ./.sqlx
COPY src ./src
COPY migrations ./migrations
COPY templates ./templates
COPY assets ./assets

ENV SQLX_OFFLINE=true

# Build for release
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

# Install runtime dependencies
RUN apt-get update && \
  apt-get install -y ca-certificates libssl3 && \
  rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/target/release/nine-to-five ./

# Change ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (adjust as needed)
EXPOSE 3000

# Run the binary
CMD ["./nine-to-five"]
