#!/bin/sh
# Luxor9 Ai Factory — Install Script
# Run this inside the service/ directory
set -e

echo "Installing Luxor9 Ai Factory Backend Dependencies..."
cd "$(dirname "$0")"

npm install express cors dotenv @google/genai uuid morgan better-sqlite3 jsonwebtoken bcryptjs multer ws

echo "Done! Start the server with: node server.js"
