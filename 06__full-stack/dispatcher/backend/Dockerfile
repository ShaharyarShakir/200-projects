FROM python:3.13-slim

# Install uv binary from official Astral image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR /app

# Copy dependency manifests first for build caching
COPY pyproject.toml uv.lock README.md ./

# Install production dependencies without installing the root project
RUN uv sync --frozen --no-dev --no-install-project

# Copy application source code
COPY . .

# Install project
RUN uv sync --frozen --no-dev

# Add virtual environment binaries to PATH
ENV PATH="/app/.venv/bin:$PATH"

RUN python manage.py collectstatic --noinput

EXPOSE 8000

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
