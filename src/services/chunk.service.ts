import { Buffer } from 'node:buffer';

import fs from 'fs';
import path from 'path';

import { VIDEO_CHUNK_SIZE_BYTES } from '@/configs/media.config';
import { makeDir, zeroPad } from '@/utils/fs.util';

export interface ByteMapEntry {
    offset: number;
    size: number;
    path: string;
}

/**
 * Splits a file into fixed-size chunks and generates a byte map.
 *
 * @param {object} params - The chunking parameters.
 * @param {string} params.sourcePath - The absolute path to the file to be chunked.
 * @param {string} params.outputDir - The directory where chunk files will be saved.
 * @returns {Promise<{ byteMap: ByteMapEntry[], totalSize: number }>} An object containing the byte map and the total size of the source file.
 */
export const chunkFile = async ({
    sourcePath,
    outputDir,
}: {
    sourcePath: string;
    outputDir: string;
}): Promise<{ byteMap: ByteMapEntry[]; totalSize: number }> => {
    const chunkDir = path.join(outputDir, 'chunks');

    await makeDir(chunkDir);

    let chunkIndex = 0;
    let totalOffset = 0;

    const byteMap: ByteMapEntry[] = [];

    const readStream = fs.createReadStream(sourcePath, {
        highWaterMark: VIDEO_CHUNK_SIZE_BYTES,
    });

    for await (const chunk of readStream) {
        const chunkNumber = zeroPad(chunkIndex, 6);
        const chunkPath = path.join(chunkDir, chunkNumber);

        await fs.promises.writeFile(chunkPath, chunk as Buffer);

        const chunkSize = (chunk as Buffer).length;

        byteMap.push({
            offset: totalOffset,
            size: chunkSize,
            path: chunkPath,
        });

        totalOffset += chunkSize;
        chunkIndex++;
    }

    return { byteMap, totalSize: totalOffset };
};
