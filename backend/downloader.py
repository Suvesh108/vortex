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

# Multiple player client strategies with matching mobile/TV user agents
STRATEGIES = [
    # 1. Android client (strong bypass)
    {
        'name': 'Android client',
        'player_client': ['android'],
        'user_agent': 'Mozilla/5.0 (Linux; Android 14; Samsung Galaxy S24) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36'
    },
    # 2. iOS client (strong bypass)
    {
        'name': 'iOS client',
        'player_client': ['ios'],
        'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
    },
    # 3. TV Embedded (embedded devices get lighter checks)
    {
        'name': 'TV Embedded client',
        'player_client': ['tv_embedded'],
        'user_agent': 'Mozilla/5.0 (Chromecast; Playback) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.125 Safari/537.36'
    },
    # 4. Mobile Web client
    {
        'name': 'Mobile Web client',
        'player_client': ['mweb'],
        'user_agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'
    },
    # 5. Combined chain fallback
    {
        'name': 'All clients fallback chain',
        'player_client': ['android', 'ios', 'tv_embedded', 'mweb'],
        'user_agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1'
    }
]

def get_ydl_opts_for_strategy(strategy, extra_opts=None):
    cookie_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')
    opts = {
        'quiet': True,
        'no_warnings': True,
        'noplaylist': True,
        'cookiefile': cookie_path if os.path.exists(cookie_path) else 'cookies.txt',
        'extractor_args': {
            'youtube': {
                'player_client': strategy['player_client'],
            }
        },
        'user_agent': strategy['user_agent'],
        'sleep_interval_requests': 1,
        'sleep_interval': 0,
        'concurrent_fragment_downloads': 1,
    }
    if extra_opts:
        opts.update(extra_opts)
    return opts

def extract_info(url):
    last_error = None
    for strategy in STRATEGIES:
        ydl_opts = get_ydl_opts_for_strategy(strategy, {
            'skip_download': True,
            'extract_flat': False,
        })
        
        try:
            print(f"[STATUS] Attempting extraction with {strategy['name']}...", file=sys.stderr, flush=True)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                title = info.get('title', 'Unknown Title')
                duration = format_duration(info.get('duration'))
                creator = info.get('uploader', info.get('channel', 'Unknown Creator'))
                
                thumbnails = info.get('thumbnails', [])
                thumbnail = ""
                if thumbnails:
                    thumbnail = thumbnails[-1].get('url', '')
                if not thumbnail:
                    thumbnail = info.get('thumbnail', '')
                    
                formats_list = info.get('formats', [])
                parsed_formats = []
                seen_resolutions = set()
                
                video_formats = [f for f in formats_list if f.get('vcodec') != 'none' and f.get('height')]
                video_formats.sort(key=lambda x: x.get('height', 0), reverse=True)
                
                for f in video_formats:
                    height = f.get('height')
                    if not height:
                        continue
                    
                    res_label = f"{height}p"
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
                    
                    vsize = f.get('filesize') or f.get('filesize_approx')
                    asize = 128 * 1024 * (info.get('duration', 0) or 0) / 8
                    total_size = vsize + asize if vsize else None
                    
                    parsed_formats.append({
                        "id": f.get('format_id'),
                        "format": "MP4",
                        "resolution": res_label,
                        "size": format_size(total_size) if total_size else "Adaptive Size",
                        "bitrate": f"{int(f.get('tbr', 0))} kbps" if f.get('tbr') else "Variable"
                    })
                    
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
                    
                result = {
                    "title": title,
                    "duration": duration,
                    "creator": creator,
                    "thumbnail": thumbnail,
                    "originalUrl": url,
                    "formats": parsed_formats
                }
                print(json.dumps(result))
                return
        except Exception as e:
            last_error = e
            print(f"[STATUS] {strategy['name']} failed: {str(e)}", file=sys.stderr, flush=True)
            
    print(json.dumps({"error": f"Extraction sequence aborted: {str(last_error)}"}))

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
        
        print(f"[PROGRESS] {percent:.1f}% | SPEED: {speed_str} | ETA: {eta_str}", flush=True)
    elif d['status'] == 'finished':
        print("[PROGRESS] 100% | Stitching and compiling streams...", flush=True)

def download_media(url, format_id, output_path):
    base_dir = os.path.dirname(output_path)
    file_name_no_ext = os.path.basename(output_path)
    outtmpl_path = os.path.join(base_dir, file_name_no_ext.split('.')[0] + '.%(ext)s')

    is_audio = format_id.startswith('bestaudio')
    
    last_error = None
    for strategy in STRATEGIES:
        ydl_opts = get_ydl_opts_for_strategy(strategy, {
            'progress_hooks': [download_progress_hook],
            'outtmpl': outtmpl_path,
        })
        
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
            if format_id != 'best':
                ydl_opts['format'] = f"{format_id}+bestaudio/best"
            else:
                ydl_opts['format'] = 'bestvideo+bestaudio/best'
            ydl_opts['merge_output_format'] = 'mp4'

        try:
            print(f"[STATUS] Attempting download with {strategy['name']}...", flush=True)
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([url])
                
            expected_ext = 'mp3' if (is_audio and 'low' not in format_id) else ('m4a' if is_audio else 'mp4')
            base_name_no_ext = file_name_no_ext.split('.')[0]
            
            for file in os.listdir(base_dir):
                if file.startswith(base_name_no_ext):
                    actual_path = os.path.join(base_dir, file)
                    if actual_path != output_path:
                        if os.path.exists(output_path):
                            os.remove(output_path)
                        os.rename(actual_path, output_path)
                    print(f"[SUCCESS] Download completed. Saved to {output_path}", flush=True)
                    return
            raise Exception("Output file not found in download directory.")
        except Exception as e:
            last_error = e
            print(f"[STATUS] Download with {strategy['name']} failed: {str(e)}", flush=True)
            
    print(f"[ERROR] Download failed after trying all strategies: {str(last_error)}", flush=True)

if __name__ == "__main__":
    # Startup check for cookies.txt
    cookie_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'cookies.txt')
    if os.path.exists(cookie_path):
        print(f"[STARTUP] cookies.txt exists at: {cookie_path}", file=sys.stderr, flush=True)
    else:
        print(f"[STARTUP] cookies.txt DOES NOT exist at: {cookie_path}", file=sys.stderr, flush=True)

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
