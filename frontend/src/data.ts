import { MediaMetadata, MediaQuality } from './types';

// Hotlinked premium tech/creative stock images matching the high-profile workspace aesthetic
export const SAMPLE_PRESETS = [
  {
    title: 'Advanced Workflow Techniques 2024',
    creator: 'VORTEXSTUDIO',
    duration: '12:45',
    url: 'https://youtube.com/watch?v=vortex-advanced-2024',
    thumbnail: 'https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?q=80&w=640&auto=format&fit=crop',
    formats: [
      { id: 'mp4-1080', format: 'MP4', resolution: '1080p', size: '24.2 MB', bitrate: '12,000 kbps' },
      { id: 'mp4-720', format: 'MP4', resolution: '720p', size: '12.8 MB', bitrate: '5,000 kbps' },
      { id: 'mp3-320', format: 'MP3', resolution: '320kbps', size: '4.1 MB', bitrate: '320 kbps' },
    ] as MediaQuality[]
  },
  {
    title: 'Lofi Cyberpunk Coding Beats • Retro Sleep / Study',
    creator: 'RetroWave Archive',
    duration: '2:45:00',
    url: 'https://youtube.com/watch?v=lofi-cyberpunk-beats',
    thumbnail: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?q=80&w=640&auto=format&fit=crop',
    formats: [
      { id: 'mp4-720', format: 'MP4', resolution: '720p', size: '1.2 GB', bitrate: '4,500 kbps' },
      { id: 'mp3-320', format: 'MP3', resolution: 'Audio 320kbps', size: '378.1 MB', bitrate: '320 kbps' },
      { id: 'm4a-128', format: 'M4A', resolution: 'Audio 128kbps', size: '151.2 MB', bitrate: '128 kbps' },
    ] as MediaQuality[]
  },
  {
    title: 'Iceland Cinematic Drone Footage 4K',
    creator: 'Horizon Exploration',
    duration: '08:20',
    url: 'https://vimeo.com/849204128',
    thumbnail: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=640&auto=format&fit=crop',
    formats: [
      { id: 'mkv-2160', format: 'MKV', resolution: '4K UltraHD', size: '189.5 MB', bitrate: '28,000 kbps' },
      { id: 'mp4-1080', format: 'MP4', resolution: '1080p HD', size: '48.3 MB', bitrate: '14,000 kbps' },
      { id: 'mp4-720', format: 'MP4', resolution: '720p', size: '18.9 MB', bitrate: '6,500 kbps' },
    ] as MediaQuality[]
  },
  {
    title: 'Interactive Design System Fundamentals',
    creator: 'Hanken Academy',
    duration: '34:12',
    url: 'https://vimeo.com/design-systems-hanken',
    thumbnail: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=640&auto=format&fit=crop',
    formats: [
      { id: 'mp4-1080', format: 'MP4', resolution: '1080p', size: '144.2 MB', bitrate: '12,000 kbps' },
      { id: 'mp4-720', format: 'MP4', resolution: '720p', size: '82.8 MB', bitrate: '6,000 kbps' },
      { id: 'm4a-192', format: 'M4A', resolution: 'Audio 192kbps', size: '47.1 MB', bitrate: '192 kbps' },
    ] as MediaQuality[]
  }
];

export function extractUrlMetadata(inputUrl: string): MediaMetadata {
  const urlLower = inputUrl.toLowerCase();
  
  // Try to match sample preset exactly first to make those beautiful previews shine
  const matchedPreset = SAMPLE_PRESETS.find(p => 
    urlLower.includes(p.url.toLowerCase()) || 
    urlLower.includes(p.creator.toLowerCase())
  );
  if (matchedPreset) {
    return {
      title: matchedPreset.title,
      duration: matchedPreset.duration,
      creator: matchedPreset.creator,
      thumbnail: matchedPreset.thumbnail,
      originalUrl: inputUrl,
      formats: matchedPreset.formats
    };
  }

  // Generate smart, realistic metadata on the fly for any other URL input
  let parsedDomain = 'Unknown Secure Source';
  try {
    const parsed = new URL(inputUrl);
    parsedDomain = parsed.hostname.replace('www.', '').split('.')[0].toUpperCase();
  } catch (e) {
    if (inputUrl.includes('youtube') || inputUrl.includes('youtu')) parsedDomain = 'YOUTUBE';
    else if (inputUrl.includes('vimeo')) parsedDomain = 'VIMEO';
    else if (inputUrl.includes('tiktok')) parsedDomain = 'TIKTOK';
    else if (inputUrl.includes('instagram')) parsedDomain = 'INSTAGRAM';
    else if (inputUrl.includes('soundcloud')) parsedDomain = 'SOUNDCLOUD';
  }

  // Extract a readable name snippet from path or leave default/creative
  let customTitle = 'Universal Media Extraction';
  const urlParts = inputUrl.split('/');
  const lastPart = urlParts[urlParts.length - 1];
  if (lastPart && lastPart.length > 5 && !lastPart.includes('?') && !lastPart.includes('=')) {
    customTitle = decodeURIComponent(lastPart)
      .replace(/[-_]/g, ' ')
      .replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  } else if (inputUrl.includes('watch?v=')) {
    const videoId = inputUrl.split('watch?v=')[1]?.substring(0, 8) || 'XYZ';
    customTitle = `Archived Content Stream [ID: ${videoId}]`;
  } else {
    customTitle = `${parsedDomain} Broadcast Flow (Ready for Archive)`;
  }

  // Select nice mock thumbnails based on domain
  let selectedThumb = 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=640&auto=format&fit=crop'; // Default cyber
  if (parsedDomain === 'YOUTUBE' || urlLower.includes('youtube')) {
    selectedThumb = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=640&auto=format&fit=crop'; // Studio setup
  } else if (parsedDomain === 'VIMEO') {
    selectedThumb = 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=640&auto=format&fit=crop'; // Cinematic camera
  } else if (parsedDomain === 'SOUNDCLOUD' || urlLower.includes('sound') || urlLower.includes('music')) {
    selectedThumb = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=640&auto=format&fit=crop'; // Sound desk
  } else if (urlLower.includes('tiktok') || urlLower.includes('instagram')) {
    selectedThumb = 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=640&auto=format&fit=crop'; // Mobile glowing
  }

  // Generate randomized formats tailored beautifully
  const isAudioOnly = urlLower.includes('soundcloud') || urlLower.includes('spotify') || urlLower.includes('audio') || urlLower.includes('mp3');
  
  const formats: MediaQuality[] = [];
  if (isAudioOnly) {
    formats.push({ id: 'mp3-320', format: 'MP3', resolution: 'Audio 320kbps Studio', size: '11.4 MB', bitrate: '320kbps' });
    formats.push({ id: 'm4a-192', format: 'M4A', resolution: 'Audio 192kbps HQ', size: '6.8 MB', bitrate: '192kbps' });
    formats.push({ id: 'mp3-128', format: 'MP3', resolution: 'Audio 128kbps Standard', size: '4.5 MB', bitrate: '128kbps' });
  } else {
    formats.push({ id: 'mp4-1080', format: 'MP4', resolution: '1080p High-bitrate', size: '45.1 MB', bitrate: '12,500 kbps' });
    formats.push({ id: 'mp4-720', format: 'MP4', resolution: '720p HD Stream', size: '22.8 MB', bitrate: '5,500 kbps' });
    formats.push({ id: 'mp3-320', format: 'MP3', resolution: 'Audio MP3 (320kbps)', size: '10.5 MB', bitrate: '320 kbps' });
  }

  // Generate random plausible duration e.g. "15:32" or "04:12"
  const randMin = Math.floor(Math.random() * 15) + 2;
  const randSec = Math.floor(Math.random() * 50) + 10;
  const durationStr = `${randMin.toString().padStart(2, '0')}:${randSec.toString().padStart(2, '0')}`;

  return {
    title: customTitle,
    duration: durationStr,
    creator: `${parsedDomain} Creator Workspace`,
    thumbnail: selectedThumb,
    originalUrl: inputUrl,
    formats
  };
}

// Creative simulated terminal console messages to show off VortexDownloader technology
export const EXTRACTION_STEPS_LOGS = [
  'Initializing Vortex Content Extraction Engine [v4.8.2]...',
  'Pre-caching secure remote endpoint certificate authorities...',
  'Establishing socket handshake with remote manifest stream provider...',
  'Bypassing server-side rate limits via cloud-mesh rotation...',
  'Manifest parsed successfully! Extracting multiplexed payload streams...',
  'Cataloging audio/video adaptive bitrates and file-structure catalogs...',
  'Analyzing optimal hardware-acceleration threads and multiplex mapping...',
  'Vortex extraction sequence complete! Content state is READY.'
];
