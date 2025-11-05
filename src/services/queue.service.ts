/**
 * @file src/services/queue.service.ts
 * @description A simple, file-based job queue service.
 *
 * Responsibilities:
 * - Enqueueing new jobs by appending them to a JSON Lines file (`jobs.jsonl`).
 * - Dequeueing jobs by reading the file, taking the first job, and rewriting the rest.
 *
 * Inputs:
 * - Job payload objects.
 *
 * Outputs:
 * - File system side effects on the `jobs.jsonl` file.
 *
 * Gotchas:
 * - This implementation is simple and not suitable for high-throughput or distributed systems.
 *   It reads and rewrites the entire queue file on each dequeue operation, which can be inefficient
 *   for very long queues.
 * - It's not truly atomic. A crash between reading and writing could lose a job. For this local-first,
 *   single-worker project, this risk is acceptable. A more robust solution would use atomic file renames
 *   or a proper database-backed queue.
 */

import fs from 'fs/promises';
import path from 'path';

import { env } from '@/configs/env';
import { JOB_QUEUE_FILENAME } from '@/configs/media.config';
import { type Job } from '@/schemas/queue.schema';
import { makeDir } from '@/utils/fs.util';

/**
 * Returns the absolute path of the job queue file.
 * @returns {string} The path of the job queue file.
 */
export function getQueueFilePath(): string {
    return path.join(env.queue.QUEUE_DIR, JOB_QUEUE_FILENAME);
}

/**
 * Adds a new job to the end of the queue.
 * @param {Job} job - The job object to enqueue.
 * @returns {Promise<void>}
 */
export async function enqueue(job: Job): Promise<void> {
    await makeDir(env.queue.QUEUE_DIR);
    const filePath = getQueueFilePath();
    const jobLine = JSON.stringify(job) + '\n';
    await fs.appendFile(filePath, jobLine, 'utf-8');
}

/**
 * Removes and returns the oldest job from the queue.
 * @returns {Promise<Job | null>} The job object, or null if the queue is empty.
 */
export async function dequeue(): Promise<Job | null> {
    await makeDir(env.queue.QUEUE_DIR);
    const filePath = getQueueFilePath();

    const data = await fs.readFile(filePath, 'utf-8');
    const lines = data.trim().split('\n');

    if (lines.length === 0 || lines[0] === '') {
        return null; // Queue is empty
    }

    const jobLine = lines.shift(); // Get the first job
    if (!jobLine) {
        return null;
    }

    const remainingLines = lines.join('\n') + (lines.length > 0 ? '\n' : '');

    // Rewrite the queue file with the remaining jobs
    await fs.writeFile(filePath, remainingLines, 'utf-8');

    return JSON.parse(jobLine) as Job;
}
