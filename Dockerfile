# ==========================================
# Stage 1: Build the React frontend
# ==========================================
FROM node:22-slim AS builder
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (required to run build script)
RUN npm ci

# Copy source code
COPY . .

# Build frontend (produces frontend/dist)
RUN npm run build

# ==========================================
# Stage 2: Final execution environment
# ==========================================
FROM node:22-slim
WORKDIR /app

# Set non-interactive timezone/frontend config
ENV DEBIAN_FRONTEND=noninteractive

# Install system dependencies:
# - python3: to execute downloader.py
# - ffmpeg: to stitch audio and video streams
# - python3-pip: to install yt-dlp
# - curl: useful for diagnostics/healthchecks (optional)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && ln -s /usr/bin/python3 /usr/bin/python \
    && rm -rf /var/lib/apt/lists/*

# Install python packages (yt-dlp)
# --break-system-packages is required in Debian/Ubuntu packages to override safe-guards
RUN pip3 install --no-cache-dir --break-system-packages yt-dlp

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies including devDependencies because tsx is a devDependency
# used to execute the backend server.
RUN npm ci

# Copy backend source files
COPY backend ./backend

# Copy the built frontend bundle into backend/dist so Express serves it
COPY --from=builder /app/frontend/dist ./backend/dist

# Expose backend port
EXPOSE 5000

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Run the backend server using npx tsx
CMD ["npx", "tsx", "backend/server.ts"]
