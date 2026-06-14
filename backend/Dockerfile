FROM node:20-bookworm-slim

# Install Python 3, pip, and ffmpeg (required for yt-dlp)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp (latest stable) and static-ffmpeg
# NOTE: do NOT install curl-cffi extra — it requires native build tools not present here.
# We bypass YouTube bot detection via the mweb/ios player_client extractor arg instead.
RUN pip3 install yt-dlp static-ffmpeg --break-system-packages

# Force upgrade yt-dlp to absolute latest version (YouTube fixes ship frequently)
RUN pip3 install --upgrade yt-dlp --break-system-packages

WORKDIR /app

# Copy all backend files (assuming build context is backend/)
COPY . .

# Install backend Node dependencies
RUN npm install

# Expose the Express backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "run", "start"]
