#!/bin/bash
set -e

echo "Cleaning up..."
rm -rf node_modules

echo "Installing dependencies..."
npm install --force

echo "Building application..."
npm run build:prod

echo "Build completed successfully!"
