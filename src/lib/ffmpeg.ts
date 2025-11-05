import { spawn } from 'child_process';

import { env } from '@/configs/env';

/**
 * Path to the ffmpeg binary.
 * - Uses FFMPEG_PATH env var if provided
 * - Falls back to "ffmpeg" (must be in PATH)
 */
const FFMPEG_BIN = env.media.FFMPEG_PATH || 'ffmpeg';

export interface FfmpegResult {
    stderr: string;
}

/**
 * Executes an FFmpeg command with the given arguments.
 * @param args - An array of arguments to pass to FFmpeg.
 * @returns A promise that resolves on successful completion or rejects on error.
 */
export const ffmpeg = (args: string[]): Promise<FfmpegResult> => {
    return new Promise((resolve, reject) => {
        const ffmpegProcess = spawn(FFMPEG_BIN, args);

        let stderrOutput = '';

        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString();
            stderrOutput += output;
        });

        ffmpegProcess.on('close', (code) => {
            if (code === 0) {
                resolve({ stderr: stderrOutput });
            } else {
                const error = new Error(`FFmpeg exited with code ${code}. Stderr:\n${stderrOutput}`);
                reject(error);
            }
        });

        ffmpegProcess.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                reject(
                    new Error(
                        `Failed to spawn ffmpeg (${FFMPEG_BIN}): ENOENT.\n` +
                            `Make sure ffmpeg is installed and either:\n` +
                            `  - Available in your PATH, or\n` +
                            `  - Set FFMPEG_PATH to the full path of the ffmpeg binary.`,
                    ),
                );
            } else {
                reject(err);
            }
        });
    });
};
