FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./

# Install dependencies (using npm install since package-lock.json doesn't exist)
RUN npm install

# Copy index.html to public directory
COPY frontend/index.html ./public/index.html

# Copy source code (removed public/ since it doesn't exist)
COPY frontend/src/ ./src/

# Build the app
RUN npm run build

# Use nginx to serve the app
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config
COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]