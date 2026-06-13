FROM node:18-bullseye-slim

# Install Python 3, pip, and ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files and install Node dependencies
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build the React/Vite frontend into the 'dist' folder
RUN npm run build

# Install Python dependencies (yt-dlp and static-ffmpeg)
RUN pip3 install yt-dlp static-ffmpeg --break-system-packages

# Create temp directory for downloads
RUN mkdir -p temp_downloads

# Expose the Express backend port
EXPOSE 5000

# Start the Express server (which will also serve the frontend 'dist' folder)
CMD ["npm", "run", "server"]
