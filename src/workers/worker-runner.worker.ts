import logger from '@/loggers/winston.logger';
import { Job } from '@/schemas/queue.schema';
import { dequeue, enqueue } from '@/services/queue.service';

import { processImageJob } from './image.worker';
import { processVideoJob } from './video.worker';

const MAX_RETRIES = 3;
const POLLING_INTERVAL_MS = 5000; // 5 seconds

// A simple in-memory map to track retries for failed jobs
const retryCounts = new Map<string, number>();

/**
 * A utility function to introduce a delay.
 * @param {number} ms - The duration to sleep in milliseconds.
 * @returns {Promise<void>}
 */
const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Dispatches a job to the correct processing function based on its kind.
 * @param {Job} job - The job to process.
 * @returns {Promise<void>}
 */
const processJob = async (job: Job): Promise<void> => {
    switch (job.kind) {
        case 'video':
            await processVideoJob(job);
            break;

        case 'image':
            await processImageJob(job);
            break;

        default:
            logger.error(`Unknown job kind encountered: ${job}`);
            break;
    }
};

/**
 * The main worker loop.
 */
const run = async () => {
    while (true) {
        let job: Job | null = null;

        try {
            job = await dequeue();

            if (job) {
                await processJob(job);

                // If successful, reset any retry counts for this media ID
                retryCounts.delete(job.mediaId);
            } else {
                // Queue is empty, wait before polling again
                await sleep(POLLING_INTERVAL_MS);
            }
        } catch (error) {
            if (job) {
                const currentRetries = retryCounts.get(job.mediaId) || 0;

                if (currentRetries < MAX_RETRIES) {
                    logger.warn(`Job failed, will retry (mediaId: ${job.mediaId}, attempt: ${currentRetries + 1})`);
                    retryCounts.set(job.mediaId, currentRetries + 1);

                    // Re-queue the job at the end of the line
                    await enqueue(job);
                } else {
                    logger.error(`Job failed after max retries. Not re-queueing (mediaId: ${job.mediaId})`);
                    retryCounts.delete(job.mediaId);
                }
            }

            // Wait after a failure to prevent rapid-fire retries
            await sleep(POLLING_INTERVAL_MS * 2);
        }
    }
};

run().catch((err) => {
    logger.error(`Worker loop crashed with error: ${err}`);
    process.exit(1);
});
