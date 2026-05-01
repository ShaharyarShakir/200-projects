#!/bin/bash
devcontainer templates apply \
	--workspace-folder . \
	--template-id ghcr.io/devcontainers/templates/typescript-node:latest \
	--template-args '{ "variant": "debian-bookworm" }' \
	--features '[
        { "id": "ghcr.io/devcontainers-extra/features/neovim-homebrew:1" }
  ]'
# you can data databases as a feature
#  --features '[
# { "id":  "ghcr.io/va-h/devcontainers-features/uv:1": },
#   { "id": "ghcr.io/devcontainers-extra/features/neovim-homebrew:1" },
#   { "id": "ghcr.io/devcontainers/features/postgres:1", "options": { "version": "15" } },
#   { "id": "ghcr.io/devcontainers/features/mongodb:1", "options": { "version": "6.0" } }
# ]'
