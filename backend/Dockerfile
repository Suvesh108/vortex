FROM node:18-bullseye-slim

# Install Python 3, pip, and ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (yt-dlp and static-ffmpeg)
RUN pip3 install yt-dlp static-ffmpeg --break-system-packages

WORKDIR /app

# Copy all backend files (assuming build context is backend/)
COPY . .

# Install backend Node dependencies
RUN npm install

# Expose the Express backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "run", "start"]
