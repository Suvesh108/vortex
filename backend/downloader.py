import sys
import json
import os
import re

# Hook static-ffmpeg path if available
try:
    import static_ffmpeg
    static_ffmpeg.add_paths()
except ImportError:
    pass

import yt_dlp

def format_duration(seconds):
    if not seconds:
        return "00:00"
    try:
        seconds = int(seconds)
        h = seconds // 3600
        m = (seconds % 3600) // 60
        s = seconds % 60
        if h > 0:
            return f"{h:02d}:{m:02d}:{s:02d}"
        else:
            return f"{m:02d}:{s:02d}"
    except Exception:
        return "00:00"

def format_size(bytes_num):
    if not bytes_num:
        return "N/A"
    try:
        bytes_num = float(bytes_num)
        for unit in ['B', 'KB', 'MB', 'GB']:
            if bytes_num < 1024.0:
                return f"{bytes_num:.1f} {unit}"
            bytes_num /= 1024.0
        return f"{bytes_num:.1f} TB"
    except Exception:
        return "N/A"

def format_speed(speed_bytes):
    if not speed_bytes:
        return "0.0 B/s"
    try:
        speed_bytes = float(speed_bytes)
        for unit in ['B/s', 'KB/s', 'MB/s', 'GB/s']:
            if speed_bytes < 1024.0:
                return f"{speed_bytes:.1f} {unit}"
            speed_bytes /= 1024.0
        return f"{speed_bytes:.1f} TB/s"
    except Exception:
        return "0.0 B/s"

# Common bot-bypass options shared between extract and download
def get_bot_bypass_opts():
    return {
        # Impersonate a real browser for TLS fingerprint bypass (requires curl_cffi)
        'impersonate': 'chrome',
        # Try multiple player clients; mweb and web tend to work without PO tokens
        'extractor_args': {
            'youtube': {
                'player_client': ['mweb', 'web', 'android'],
            }
        },
        # Mimic human browsing speed
        'sleep_interval': 1,
        'max_sleep_interval': 3,
        # Don't fragment requests aggressively
        'concurrent_fragment_downloads': 1,
    }

def extract_info(url):
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'extract_flat': False,
        'noplaylist': True,
        **get_bot_bypass_opts(),
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Format title, duration, creator, thumbnail
            title = info.get('title', 'Unknown Title')
            duration = format_duration(info.get('duration'))
            creator = info.get('uploader', info.get('channel', 'Unknown Creator'))
            
            # Find best thumbnail
            thumbnails = info.get('thumbnails', [])
            thumbnail = ""
            if thumbnails:
                # Prefer high res
                thumbnail = thumbnails[-1].get('url', '')
            if not thumbnail:
                thumbnail = info.get('thumbnail', '')
                
            # Parse available formats
            formats_list = info.get('formats', [])
            parsed_formats = []
            
            # For YouTube, high quality videos are adaptive (video-only).
            # We want to offer standard predefined video qualities and merge them with audio on download.
            # Let's filter out interesting formats:
            # We want a few standard video resolutions if they exist: 1080p, 720p, 480p, 360p, and a separate Audio-only option.
            
            # Let's look for video formats and construct merged representations.
            seen_resolutions = set()
            
            # yt-dlp format sorting
            # We want to show options to the user:
            # 1. MP4 Video (1080p, 720p, 480p, 360p) - these might need stitching with audio.
            # 2. MP3 Audio (320kbps, 128kbps) - extracted from audio stream.
            
            # Let's check what video resolutions are available
            video_formats = [f for f in formats_list if f.get('vcodec') != 'none' and f.get('height')]
            
            # Sort video formats by height descending
            video_formats.sort(key=lambda x: x.get('height', 0), reverse=True)
            
            for f in video_formats:
                height = f.get('height')
                if not height:
                    continue
                
                res_label = f"{height}p"
                # Standardize resolution tags:
                if height >= 2160:
                    res_label = "4K UHD (2160p)"
                elif height >= 1440:
                    res_label = "1440p QHD"
                elif height >= 1080:
                    res_label = "1080p FHD"
                elif height >= 720:
                    res_label = "720p HD"
                else:
                    res_label = f"{height}p"
                    
                if height in seen_resolutions:
                    continue
                seen_resolutions.add(height)
                
                # Estimate size if not present (video size + approximate audio size 128kbps)
                vsize = f.get('filesize') or f.get('filesize_approx')
                asize = 128 * 1024 * (info.get('duration', 0) or 0) / 8 # approx audio size
                total_size = vsize + asize if vsize else None
                
                parsed_formats.append({
                    "id": f.get('format_id'),
                    "format": "MP4",
                    "resolution": res_label,
                    "size": format_size(total_size) if total_size else "Adaptive Size",
                    "bitrate": f"{int(f.get('tbr', 0))} kbps" if f.get('tbr') else "Variable"
                })
                
            # Add an MP3 Audio format option if audio is available
            audio_formats = [f for f in formats_list if f.get('acodec') != 'none' and f.get('vcodec') == 'none']
            if audio_formats or formats_list:
                parsed_formats.append({
                    "id": "bestaudio",
                    "format": "MP3",
                    "resolution": "Audio 320kbps",
                    "size": format_size(320 * 1024 * (info.get('duration', 0) or 0) / 8) if info.get('duration') else "Adaptive Size",
                    "bitrate": "320 kbps"
                })
                parsed_formats.append({
                    "id": "bestaudio-low",
                    "format": "M4A",
                    "resolution": "Audio 128kbps",
                    "size": format_size(128 * 1024 * (info.get('duration', 0) or 0) / 8) if info.get('duration') else "Adaptive Size",
                    "bitrate": "128 kbps"
                })
                
            # limit formatting response
            result = {
                "title": title,
                "duration": duration,
                "creator": creator,
                "thumbnail": thumbnail,
                "originalUrl": url,
                "formats": parsed_formats
            }
            print(json.dumps(result))
            
    except Exception as e:
        print(json.dumps({"error": str(e)}))

def download_progress_hook(d):
    if d['status'] == 'downloading':
        total = d.get('total_bytes') or d.get('total_bytes_estimate') or 0
        downloaded = d.get('downloaded_bytes') or 0
        
        percent = 0
        if total > 0:
            percent = (downloaded / total) * 100
            
        speed = d.get('speed')
        speed_str = format_speed(speed)
        
        eta = d.get('eta')
        eta_str = f"{eta}s" if eta else "Unknown"
        
        # Output clean parsing markers for server.ts
        print(f"[PROGRESS] {percent:.1f}% | SPEED: {speed_str} | ETA: {eta_str}", flush=True)
    elif d['status'] == 'finished':
        print("[PROGRESS] 100% | Stitching and compiling streams...", flush=True)

def download_media(url, format_id, output_path):
    # Setup download options
    # Output path is the exact target path (e.g., temp_downloads/job-id.mp4)
    # We strip extension to let yt-dlp suffix it, and then rename it, or we use outtmpl exactly.
    # To keep it simple, we download to directory and let yt-dlp append extension, then we find the resulting file.
    
    base_dir = os.path.dirname(output_path)
    file_name_no_ext = os.path.basename(output_path)
    # Remove extension from output_path as yt-dlp merges and renames
    outtmpl_path = os.path.join(base_dir, file_name_no_ext.split('.')[0] + '.%(ext)s')

    is_audio = format_id.startswith('bestaudio')
    
    ydl_opts = {
        'progress_hooks': [download_progress_hook],
        'outtmpl': outtmpl_path,
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        **get_bot_bypass_opts(),
    }
    
    if is_audio:
        codec = 'mp3' if 'low' not in format_id else 'm4a'
        quality = '320' if 'low' not in format_id else '128'
        ydl_opts.update({
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': codec,
                'preferredquality': quality,
            }]
        })
    else:
        # If specific format is chosen, download that video and combine with best audio
        # Example format_id: "137" (1080p video-only). We request format_id + bestaudio.
        # This will download both and merge them with ffmpeg.
        if format_id != 'best':
            ydl_opts['format'] = f"{format_id}+bestaudio/best"
        else:
            ydl_opts['format'] = 'bestvideo+bestaudio/best'
            
        # Merge into mp4 container
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        print(f"[STATUS] Initializing stream download payload...", flush=True)
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
            
        # Find the downloaded file (it might have mp4 or mp3 extension depending on what postprocessor did)
        expected_ext = 'mp3' if (is_audio and 'low' not in format_id) else ('m4a' if is_audio else 'mp4')
        base_name_no_ext = file_name_no_ext.split('.')[0]
        
        # Scan folder for files starting with base_name_no_ext
        for file in os.listdir(base_dir):
            if file.startswith(base_name_no_ext):
                actual_path = os.path.join(base_dir, file)
                # If the extension is not exactly what we requested, or if we want to rename it to exactly output_path:
                if actual_path != output_path:
                    # Rename/overwrite to output_path
                    if os.path.exists(output_path):
                        os.remove(output_path)
                    os.rename(actual_path, output_path)
                print(f"[SUCCESS] Download completed. Saved to {output_path}", flush=True)
                return
                
        print(f"[ERROR] Could not find the output file in directory {base_dir}", flush=True)
    except Exception as e:
        print(f"[ERROR] Download failed: {str(e)}", flush=True)

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python downloader.py [info|download] [args...]")
        sys.exit(1)
        
    cmd = sys.argv[1]
    
    if cmd == "info":
        url = sys.argv[2]
        extract_info(url)
    elif cmd == "download":
        if len(sys.argv) < 5:
            print("Usage: python downloader.py download [url] [format_id] [output_path]")
            sys.exit(1)
        url = sys.argv[2]
        format_id = sys.argv[3]
        output_path = sys.argv[4]
        download_media(url, format_id, output_path)
    else:
        print(f"Unknown command: {cmd}")
        sys.exit(1)
