FROM node:20-bookworm-slim

# Install Python 3, pip, ffmpeg, curl, deno prerequisites
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-dev \
    ffmpeg \
    curl \
    unzip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install Deno (required for yt-dlp JS challenge solving)
RUN curl -fsSL https://deno.land/install.sh | sh
ENV DENO_INSTALL="/root/.deno"
ENV PATH="${DENO_INSTALL}/bin:${PATH}"

# Install yt-dlp (latest), curl_cffi (TLS fingerprint bypass), static-ffmpeg and PO token provider plugin
RUN pip3 install \
    "yt-dlp[default,curl-cffi]" \
    static-ffmpeg \
    yt-dlp-getpot-wpc \
    --break-system-packages

WORKDIR /app

# Copy all backend files (assuming build context is backend/)
COPY . .

# Install backend Node dependencies
RUN npm install

# Expose the Express backend port
EXPOSE 5000

# Start the Express server
CMD ["npm", "run", "start"]
