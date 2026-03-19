FROM node:20-alpine

WORKDIR /app

# Copy all service files
COPY . .

# Install dependencies - install the new packages alongside existing ones
RUN npm install --production 2>/dev/null || \
    (npm install better-sqlite3 jsonwebtoken bcryptjs multer ws --save 2>/dev/null && npm install --production 2>/dev/null) || \
    echo "Dependencies may need manual installation"

# Create data directories
RUN mkdir -p data/uploads

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
