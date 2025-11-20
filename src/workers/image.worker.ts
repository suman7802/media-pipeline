import { log } from 'console';

import logger from '@/loggers/winston.logger';
import { MediaManifest } from '@/schemas/media.schema';
import { ImageJob } from '@/schemas/queue.schema';
import { createRenditions, extractThumbnailFromImage } from '@/services/image.service';
import { getMediaRoot, updateManifest } from '@/services/media.service';
import { extractThumbnailFromVideo } from '@/services/video.service';

/**
 * Processes a single image job.
 * @param {ImageJob} job - The image job to process.
 * @returns {Promise<void>}
 * @throws {Error} if a critical step fails.
 */
export const processImageJob = async (job: ImageJob): Promise<void> => {
    const { mediaId, rawFilePath } = job;

    try {
        await updateManifest(mediaId, { status: 'processing' });

        const mediaRoot = getMediaRoot(mediaId);

        //  Create image renditions
        const imageRenditions = await createRenditions({
            sourcePath: rawFilePath,
            outputDir: mediaRoot,
        });

        if (imageRenditions.length === 0) {
            throw new Error('All image resizings failed.');
        }

        const thumbnailPath = await extractThumbnailFromImage({
            sourcePath: rawFilePath,
            outputDir: mediaRoot,
        });

        // Update manifest with final data
        const finalUpdate: Partial<MediaManifest> = {
            status: 'completed',
            thumbnailPath: thumbnailPath,
            images: imageRenditions,
        };

        await updateManifest(mediaId, finalUpdate);

        logger.info(`Image processing job completed successfully (mediaId: ${mediaId})`);
    } catch (error: any) {
        logger.error(`Image processing job failed (mediaId: ${mediaId}): ${error}`);

        await updateManifest(mediaId, {
            status: 'failed',
            error: error.message || 'An unknown error occurred during processing.',
        });

        throw error;
    }
};
