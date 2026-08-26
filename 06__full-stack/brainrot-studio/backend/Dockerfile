FROM python:3.13-slim

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
       ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --no-cache-dir uv
RUN uv sync --frozen

CMD ["uv", "run", "fastapi", "run", "app/main.py", "--host", "0.0.0.0"]
