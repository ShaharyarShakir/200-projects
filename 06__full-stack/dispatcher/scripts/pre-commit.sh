#!/usr/bin/env bash
set -e

# Visual formatting
BOLD="\033[1m"
GREEN="\033[32m"
RED="\033[31m"
YELLOW="\033[33m"
CYAN="\033[36m"
RESET="\033[0m"

echo -e "${BOLD}${CYAN}========================================${RESET}"
echo -e "${BOLD}${CYAN}  Running Dispatcher Pre-Commit Hooks   ${RESET}"
echo -e "${BOLD}${CYAN}========================================${RESET}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FAILED=0

# --- FRONTEND CHECKS ---
echo -e "\n${BOLD}${YELLOW}[1/2] Checking Frontend (React + TypeScript)...${RESET}"
cd "$ROOT_DIR/frontend"

echo -e "  ${CYAN}-> Running oxlint / linter...${RESET}"
if pnpm run lint; then
  echo -e "  ${GREEN}✓ Frontend linting passed${RESET}"
else
  echo -e "  ${RED}✗ Frontend linting failed!${RESET}"
  FAILED=1
fi

echo -e "  ${CYAN}-> Running TypeScript typecheck & build...${RESET}"
if pnpm run build; then
  echo -e "  ${GREEN}✓ Frontend typecheck & build passed${RESET}"
else
  echo -e "  ${RED}✗ Frontend build failed!${RESET}"
  FAILED=1
fi

# --- BACKEND CHECKS ---
echo -e "\n${BOLD}${YELLOW}[2/2] Checking Backend (Django + Python)...${RESET}"
cd "$ROOT_DIR/backend"

PYTHON_BIN="python"
if [ -f ".venv/bin/python" ]; then
  PYTHON_BIN=".venv/bin/python"
elif command -v uv &> /dev/null; then
  PYTHON_BIN="uv run python"
fi

RUFF_BIN="ruff"
if [ -f ".venv/bin/ruff" ]; then
  RUFF_BIN=".venv/bin/ruff"
elif command -v uv &> /dev/null; then
  RUFF_BIN="uv run ruff"
fi

echo -e "  ${CYAN}-> Running Ruff linter...${RESET}"
if $RUFF_BIN check .; then
  echo -e "  ${GREEN}✓ Backend Ruff linter passed${RESET}"
else
  echo -e "  ${RED}✗ Backend Ruff linter failed!${RESET}"
  FAILED=1
fi

echo -e "  ${CYAN}-> Running Ruff code format check...${RESET}"
if $RUFF_BIN format --check .; then
  echo -e "  ${GREEN}✓ Backend Ruff formatting check passed${RESET}"
else
  echo -e "  ${RED}✗ Backend Ruff formatting check failed!${RESET}"
  FAILED=1
fi

echo -e "  ${CYAN}-> Running Django unit tests...${RESET}"
if $PYTHON_BIN manage.py test --noinput; then
  echo -e "  ${GREEN}✓ Backend Django unit tests passed${RESET}"
else
  echo -e "  ${RED}✗ Backend Django tests failed!${RESET}"
  FAILED=1
fi

echo -e "\n${BOLD}${CYAN}========================================${RESET}"
if [ $FAILED -ne 0 ]; then
  echo -e "${BOLD}${RED} ❌ Pre-commit checks failed. Please fix the issues above before committing.${RESET}"
  echo -e "${BOLD}${CYAN}========================================${RESET}"
  exit 1
else
  echo -e "${BOLD}${GREEN} ✅ All frontend and backend pre-commit checks passed successfully!${RESET}"
  echo -e "${BOLD}${CYAN}========================================${RESET}"
  exit 0
fi
