import fs from 'fs/promises';
import path from 'path';

import { IMAGE_FORMATS, IMAGE_SIZES } from '@/configs/media.config';
import sharp from '@/lib/sharp';
import { ImageFormat, ImageSize } from '@/schemas/media.schema';
import { makeDir } from '@/utils/fs.util';

export interface ResizeResult {
    path: string;
    size: ImageSize;
    format: ImageFormat;
    contentLength: number;
    resolution: { width: number; height: number };
}

/**
 * Creates multiple resized and formatted renditions of a source image.
 *
 * @param {object} params - The image processing parameters.
 * @param {string} params.sourcePath - Absolute path to the source image.
 * @param {string} params.outputDir - Absolute path to the output directory for image renditions.
 * @returns {Promise<ResizeResult[]>} A list of objects describing each created image.
 */
export const createRenditions = async ({ sourcePath, outputDir }: { sourcePath: string; outputDir: string }): Promise<ResizeResult[]> => {
    const results: ResizeResult[] = [];
    const imageDir = path.join(outputDir, 'images');

    for (const size of IMAGE_SIZES) {
        const sizeDir = path.join(imageDir, String(size));

        await makeDir(sizeDir);

        for (const format of IMAGE_FORMATS) {
            const outputPath = path.join(sizeDir, `image.${format}`);

            const sharpInstance = sharp(sourcePath).resize({
                width: size,
                withoutEnlargement: true, // Don't scale up images smaller than the target size
            });

            let outputInfo: sharp.OutputInfo;

            if (format === 'jpeg') {
                outputInfo = await sharpInstance.jpeg({ quality: 80, progressive: true }).toFile(outputPath);
            } else {
                // webp
                outputInfo = await sharpInstance.webp({ quality: 80 }).toFile(outputPath);
            }

            const stats = await fs.stat(outputPath);

            results.push({
                path: outputPath,
                size: size,
                format: format,
                contentLength: stats.size,
                resolution: {
                    width: outputInfo.width,
                    height: outputInfo.height,
                },
            });
        }
    }

    return results;
};

/**
 * Extracts a single thumbnail from a source image.
 *
 * @param {object} params - The thumbnail extraction parameters.
 * @param {string} params.sourcePath - The absolute path to the source image file.
 * @param {string} params.outputDir - The absolute path to the output directory for the thumbnail.
 * @returns {Promise<string>} The path to the created thumbnail.
 */
export const extractThumbnailFromImage = async ({ sourcePath, outputDir }: { sourcePath: string; outputDir: string }): Promise<string> => {
    const thumbDir = path.join(outputDir, 'thumbs');
    await makeDir(thumbDir);
    const outputPath = path.join(thumbDir, 'thumbnail.jpg');

    await sharp(sourcePath).resize({ width: 200, withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toFile(outputPath);
    return outputPath;
};
