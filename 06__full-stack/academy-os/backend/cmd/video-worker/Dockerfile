FROM golang:1.25-bookworm AS builder


ENV GOTOOLCHAIN=auto

WORKDIR /app


COPY backend/go.mod backend/go.sum ./

RUN go mod download

COPY backend/ ./

RUN CGO_ENABLED=0 \
    GOOS=linux \
    go build \
    -o /video-worker \
    ./cmd/video-worker

FROM jrottenberg/ffmpeg:7-ubuntu

WORKDIR /app

COPY --from=builder /video-worker /app/video-worker

ENTRYPOINT ["/app/video-worker"]
