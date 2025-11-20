export const VIDEO_LADDER = [
    { quality: '240p', height: 240, bitrate: '400k', maxrate: '428k', bufsize: '600k' },
    { quality: '360p', height: 360, bitrate: '800k', maxrate: '856k', bufsize: '1200k' },
    { quality: '480p', height: 480, bitrate: '1200k', maxrate: '1284k', bufsize: '1800k' },
    { quality: '720p', height: 720, bitrate: '2500k', maxrate: '2675k', bufsize: '3750k' },
    { quality: '1080p', height: 1080, bitrate: '4500k', maxrate: '4815k', bufsize: '6750k' },
].sort((a, b) => a.height - b.height);

export const IMAGE_FORMATS = ['webp', 'jpeg'];
export const IMAGE_SIZES = [3840, 2560, 1920, 1280, 854];
export const MANIFEST_FILENAME = 'manifest.json';
export const JOB_QUEUE_FILENAME = 'jobs.jsonl';
export const VIDEO_CHUNK_SIZE_BYTES = 4 * 1024 * 1024; // 4 MB
export const MAX_MEDIA_UPLOAD_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
