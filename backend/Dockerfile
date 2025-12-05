# Build stage
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git

# Set Go module proxy for faster downloads
ENV GOPROXY=https://goproxy.cn,direct

# Copy go mod files
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the application (limit parallelism to reduce memory usage)
RUN CGO_ENABLED=0 GOOS=linux go build -p 1 -o main .

# Production stage
FROM alpine:latest

WORKDIR /app

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/main .

# Copy config files if needed
COPY --from=builder /app/config ./config

# Expose port
EXPOSE 8080

# Run the binary
CMD ["./main"]
