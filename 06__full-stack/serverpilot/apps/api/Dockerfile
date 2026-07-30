# Build stage
FROM golang:1.26-alpine AS builder

# Install build dependencies
RUN apk add --no-cache git gcc musl-dev

WORKDIR /app

# Copy dependency files relative to monorepo root context
COPY apps/api/go.mod apps/api/go.sum ./

# Download dependencies
RUN go mod download

# Copy backend source code
COPY apps/api/ ./

# Build optimized static Go binary (pure Go, CGO disabled)
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o serverpilot-api main.go

# Production stage
FROM alpine:latest

RUN apk --no-cache add ca-certificates tzdata

WORKDIR /app

# Copy binary from builder stage
COPY --from=builder /app/serverpilot-api .

# Expose default API port
EXPOSE 8080

# Start server
CMD ["./serverpilot-api"]
