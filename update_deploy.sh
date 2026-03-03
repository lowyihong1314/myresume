#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$ROOT_DIR/frontend"
WORKER_DIR="$ROOT_DIR/worker"

if ! command -v npm >/dev/null 2>&1; then
  echo "Error: npm not found in PATH."
  exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
  echo "Error: frontend directory not found: $FRONTEND_DIR"
  exit 1
fi

if [ ! -d "$WORKER_DIR" ]; then
  echo "Error: worker directory not found: $WORKER_DIR"
  exit 1
fi

echo "==> Building frontend..."
cd "$FRONTEND_DIR"
npm run build

echo "==> Deploying worker..."
cd "$WORKER_DIR"
npm run deploy -- "$@"

echo "==> Done."
