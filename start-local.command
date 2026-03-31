#!/bin/zsh

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR" || exit 1

if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install || exit 1
fi

echo "Starting local server on http://localhost:3000 ..."
( sleep 2; open "http://localhost:3000" ) &
npm run dev -- --port 3000
