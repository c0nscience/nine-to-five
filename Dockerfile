# Build stage
FROM rust:1.90-bookworm AS builder

# Install build dependencies
RUN apt-get update && \
  apt-get install --no-install-recommends -y pkg-config=1.8.1-1 libssl-dev=3.0.17-1~deb12u3 && \
  rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy manifests
COPY Cargo.toml Cargo.lock ./

# Create dummy source to cache dependencies
RUN mkdir src && \
  echo 'fn main() {println!("dummy");}' > src/main.rs && \
  cargo build --release && \
  cargo clean --release -p nine-to-five && \
  rm -rf src

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
  apt-get install --no-install-recommends -y ca-certificates=20230311+deb12u1 libssl3=3.0.17-1~deb12u3 && \
  rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1001 appuser

WORKDIR /app

# Copy binary from builder
COPY --from=builder /app/assets/ ./assets/
COPY --from=builder /app/templates/ ./templates/
COPY --from=builder /app/target/release/nine-to-five ./

# Change ownership
RUN chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port (adjust as needed)
EXPOSE 3000

# Run the binary
CMD ["./nine-to-five"]
