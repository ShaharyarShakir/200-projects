#!/usr/bin/env bash
set -o errexit

# Install uv if not available
if ! command -v uv &> /dev/null; then
    pip install uv
fi

# Synchronize production dependencies from uv.lock
uv sync --frozen --no-dev

# Run static file collection and database migrations
uv run python manage.py collectstatic --no-input
uv run python manage.py migrate
