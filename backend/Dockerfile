FROM node:20-bookworm-slim

# Install Python 3, pip, ffmpeg, curl, and unzip (unzip is required to install Deno)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    unzip \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (official JS runtime recommended for yt-dlp JS signature/n-challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Install yt-dlp (latest stable) and static-ffmpeg
RUN pip3 install yt-dlp static-ffmpeg --break-system-packages

# Force upgrade yt-dlp to absolute latest version (YouTube updates ship frequently)
RUN pip3 install --upgrade yt-dlp --break-system-packages

WORKDIR /app

# Copy all backend files (including cookies.txt)
COPY . .

# Install backend Node dependencies
RUN npm install

# Expose the Express backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "run", "start"]
