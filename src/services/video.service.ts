import path from 'path';

import { VIDEO_LADDER } from '@/configs/media.config';
import { ffmpeg } from '@/lib/ffmpeg';
import logger from '@/loggers/winston.logger';
import { makeDir } from '@/utils/fs.util';

/**
 * Executes a single FFmpeg transcode command for one rendition.
 *
 * @param {object} params - The parameters for a single transcode operation.
 * @param {string} params.sourcePath - The source video path.
 * @param {string} params.outputPath - The target video path.
 * @param {VideoRenditionConfig} params.config - The configuration for this rendition.
 * @returns {Promise<void>}
 */
export const transcodeRendition = async ({
    sourcePath,
    outputPath,
    config,
}: {
    sourcePath: string;
    outputPath: string;
    config: (typeof VIDEO_LADDER)[number];
}): Promise<void> => {
    const args = [
        '-i',
        sourcePath,
        '-vf',
        `scale=-2:${config.height}`, // Scale to target height, maintain aspect ratio
        '-c:v',
        'libx264',
        '-preset',
        'veryfast', // Balances encoding speed and quality
        '-b:v',
        config.bitrate,
        '-maxrate',
        config.maxrate,
        '-bufsize',
        config.bufsize,
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        '-movflags',
        '+faststart', // Important for web playback, moves metadata to the start
        '-y', // Overwrite output file if it exists
        outputPath,
    ];

    await ffmpeg(args);
};

export interface TranscodeResult {
    path: string;
    quality: string;
    resolution: { width: number; height: number };
}

/**
 * Transcodes a source video into multiple quality renditions based on the VIDEO_LADDER.
 *
 * @param {object} params - The transcoding parameters.
 * @param {string} params.sourcePath - The absolute path to the source video file.
 * @param {string} params.outputDir - The absolute path to the output directory for renditions.
 * @returns {Promise<TranscodeResult[]>} A list of objects describing each created rendition.
 */
export const transcodeToLadder = async ({ sourcePath, outputDir }: { sourcePath: string; outputDir: string }): Promise<TranscodeResult[]> => {
    const results: TranscodeResult[] = [];

    for (const config of VIDEO_LADDER) {
        logger.info(`Transcoding to ${config.quality} (${config.height}p)...`);

        const renditionDir = path.join(outputDir, config.quality);
        await makeDir(renditionDir);
        const outputPath = path.join(renditionDir, 'video.mp4');

        await transcodeRendition({
            sourcePath,
            outputPath,
            config,
        });

        results.push({
            path: outputPath,
            quality: config.quality,
            resolution: { width: -1, height: config.height },
        });
    }

    return results;
};

/**
 * Extracts a single thumbnail from a video file.
 * @param {object} params - The thumbnail extraction parameters.
 * @param {string} params.sourcePath - Path to the video file.
 * @param {string} params.outputDir - Directory to save the thumbnail.
 * @param {number} [params.timestampSeconds=2] - The point in the video to grab the frame from.
 * @returns {Promise<string>} The path to the created thumbnail.
 */
export const extractThumbnailFromVideo = async ({
    sourcePath,
    outputDir,
    timestampSeconds = 2,
}: {
    sourcePath: string;
    outputDir: string;
    timestampSeconds?: number;
}): Promise<string> => {
    const thumbDir = path.join(outputDir, 'thumbs');
    await makeDir(thumbDir);
    const outputPath = path.join(thumbDir, 'thumbnail.jpg');

    const args = [
        '-i',
        sourcePath,
        '-ss',
        String(timestampSeconds), // Seek to the specified timestamp
        '-vframes',
        '1', // Extract only one frame
        '-q:v',
        '2', // Output quality (1-31, lower is better)
        '-y', // Overwrite output file
        outputPath,
    ];

    await ffmpeg(args);
    return outputPath;
};
