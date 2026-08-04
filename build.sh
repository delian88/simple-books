#!/bin/bash
set -e

echo "Cleaning up..."
rm -rf node_modules package-lock.json

echo "Installing dependencies with legacy peer deps..."
npm install --legacy-peer-deps --no-optional

echo "Installing rolldown bindings explicitly..."
npm install @rolldown/binding-linux-x64-gnu --no-save --force || true

echo "Building application..."
npm run build:prod

echo "Build completed successfully!"
