import fs from 'fs/promises';
import path from 'path';

import { VIDEO_CHUNK_SIZE_BYTES } from '@/configs/media.config';
import logger from '@/loggers/winston.logger';
import { MediaManifest, VideoRendition } from '@/schemas/media.schema';
import { VideoJob } from '@/schemas/queue.schema';
import { chunkFile } from '@/services/chunk.service';
import { getMediaRoot, updateManifest } from '@/services/media.service';
import { extractThumbnail, transcodeToLadder } from '@/services/video.service';

/**
 * Processes a single video job.
 * @param {VideoJob} job - The video job to process.
 * @returns {Promise<void>}
 * @throws {Error} if a critical step fails.
 */
export const processVideoJob = async (job: VideoJob): Promise<void> => {
    const { mediaId, rawFilePath } = job;

    try {
        await updateManifest(mediaId, { status: 'processing' });

        const mediaRoot = getMediaRoot(mediaId);
        const renditionsDir = path.join(mediaRoot, 'renditions');

        // Transcode video into ABR ladder
        const transcodeResults = await transcodeToLadder({
            sourcePath: rawFilePath,
            outputDir: renditionsDir,
        });

        if (transcodeResults.length === 0) {
            throw new Error('All video transcodings failed.');
        }

        // Chunk each rendition and build manifest data
        const renditions: VideoRendition[] = [];

        for (const result of transcodeResults) {
            const { byteMap, totalSize } = await chunkFile({
                sourcePath: result.path,
                outputDir: path.dirname(result.path),
            });

            // After chunking, the large monolithic MP4 is no longer needed. Delete it to save space.
            await fs.unlink(result.path);

            renditions.push({
                quality: result.quality as any, // type assertion as it's from constants
                resolution: result.resolution,
                contentLength: totalSize,
                mimeType: 'video/mp4',
                byteMap: byteMap,
            });
        }

        // Extract thumbnail
        const thumbnailPath = await extractThumbnail({
            sourcePath: rawFilePath,
            outputDir: mediaRoot,
        });

        // Update manifest with final data
        const finalUpdate: Partial<MediaManifest> = {
            status: 'completed',
            renditions,
            thumbnailPath,
            chunkSize: VIDEO_CHUNK_SIZE_BYTES,
        };

        await updateManifest(mediaId, finalUpdate);

        logger.info(`Video processing job completed successfully (mediaId: ${mediaId})`);
    } catch (error: any) {
        logger.error(`Video processing job failed (mediaId: ${mediaId}): ${error}`);

        await updateManifest(mediaId, {
            status: 'failed',
            error: error.message || 'An unknown error occurred during processing.',
        });

        throw error;
    }
};
