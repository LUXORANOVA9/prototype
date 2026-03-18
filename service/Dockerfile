FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package.json* ./

# Install dependencies (handles both old and new package.json)
RUN if [ -f package.json ]; then npm install --production; fi

# Copy application code
COPY . .

# Create data directories
RUN mkdir -p data/uploads

EXPOSE 8080

CMD ["node", "server.js"]
