FROM ubuntu:24.04

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ffmpeg \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY process.sh /app/process.sh

RUN chmod +x /app/process.sh

ENTRYPOINT ["/app/process.sh"]
