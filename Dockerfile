FROM node:20-bullseye-slim

# Install Python 3, pip, and ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy the root workspace package manager files
COPY package*.json ./

# Copy frontend and backend
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Install dependencies for both frontend and backend
RUN npm install

# Build the React/Vite frontend
RUN npm run build

# Move the frontend dist folder to backend so express can serve it natively
RUN mv frontend/dist backend/dist

# Install Python dependencies (yt-dlp and static-ffmpeg)
RUN pip3 install yt-dlp static-ffmpeg --break-system-packages

# Set working directory to backend
WORKDIR /app/backend

# Create temp directory for downloads
RUN mkdir -p temp_downloads

# Expose the Express backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "run", "start"]
