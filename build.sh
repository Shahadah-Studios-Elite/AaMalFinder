#!/usr/bin/env bash
set -e

echo "=== Starting A'aMalFinder Build ==="
npm install
npm run clean
npm run build
cp index.html dist/
cp styles.css dist/
echo "=== Build completed successfully in ./dist ==="
