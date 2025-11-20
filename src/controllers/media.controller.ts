import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import { ulid } from 'ulid';

import { env } from '@/configs/env';
import { ERROR_CODES } from '@/constants/error.codes';
import { STATUS_CODES } from '@/constants/status.codes';
import { ApiError } from '@/errors/ApiError.error';
import asyncCatch from '@/errors/asyncCatch.error';
import { getMediaType, parseRange } from '@/helpers/helper';
import logger from '@/loggers/winston.logger';
import { GetImage, PlayVideo, uploadMediaType } from '@/schemas/media.schema';
import { initializeMedia, readManifest } from '@/services/media.service';
import { enqueue } from '@/services/queue.service';
import { RangeStreamer } from '@/streaming/rangeStreamer';
import { customSuccessResponse } from '@/utils/customSuccessResponse.util';

/**
 * Handles the media upload request.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
export const handleMediaUpload = asyncCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const t = req.t;
    const file = req.file!;
    const { title, tags } = req.body as uploadMediaType;

    const mediaId = ulid();
    const kind = getMediaType(req, file);

    // create the manifest.json for the uploaded media
    const manifest = await initializeMedia({
        id: mediaId,
        title: title,
        tags: tags || [],
        kind: kind,
        originalFilePath: file.path,
        originalFilename: file.originalname,
    });

    // Enqueue the media for processing at ./queue/jobs.jsonl
    await enqueue({
        mediaId,
        kind: kind,
        rawFilePath: manifest.rawFilePath!,
    });

    customSuccessResponse(res, 201, t('media_added_to_queue'), {
        id: mediaId,
        status: 'queued',
        manifestUrl: `/media/${mediaId}/manifest`,
    });
});

/**
 * Serves a resized image rendition.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
export const serveImage = asyncCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const t = req.t;

    const { id } = req.params as unknown as GetImage['params'];
    const { size, format } = req.query as unknown as GetImage['query'];

    const manifest = await readManifest(id);

    if (!manifest || manifest.kind !== 'image' || manifest.status !== 'completed') {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            t('media_not_found_message', { ns: 'error' }),
            t('media_not_found_details', { ns: 'error' }),
            t('media_not_found_suggestion', { ns: 'error' }),
        );
    }

    const imageRendition = manifest.images?.find((img) => img.size === size && img.format === format);

    if (!imageRendition) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            t('media_not_found_message', { ns: 'error' }),
            t('media_not_found_details', { ns: 'error' }),
            t('media_not_found_suggestion', { ns: 'error' }),
        );
    }

    const imagePath = imageRendition.path;
    const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';

    // Check if file exists before sending
    if (!fs.existsSync(imagePath)) {
        logger.error(`Image file not found on disk, but present in manifest: ${imagePath}`);
        throw new ApiError(
            STATUS_CODES.INTERNAL_ERROR,
            ERROR_CODES.INTERNAL_ERROR,
            t('internal_error_message', { ns: 'error' }),
            t('internal_error_details', { ns: 'error' }),
            t('internal_error_suggestion', { ns: 'error' }),
        );
    }

    res.writeHead(200, {
        'Content-Type': mimeType,
        'Content-Length': imageRendition.contentLength,
    });

    fs.createReadStream(imagePath).pipe(res);
});

/**
 * Handles streaming a video rendition.
 * @param {Request} req - The Express request object.
 * @param {Response} res - The Express response object.
 * @param {NextFunction} next - The Express next function.
 */
export const streamVideo = asyncCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const t = req.t;
    const { id } = req.params as PlayVideo['params'];
    const { quality } = req.query as PlayVideo['query'];

    const manifest = await readManifest(id);
    if (!manifest || manifest.kind !== 'video' || manifest.status !== 'completed') {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            t('media_not_found_message', { ns: 'error' }),
            t('media_not_found_details', { ns: 'error' }),
            t('media_not_found_suggestion', { ns: 'error' }),
        );
    }

    const rendition = manifest.renditions?.find((r) => r.quality === quality);
    if (!rendition) {
        throw new ApiError(
            STATUS_CODES.NOT_FOUND,
            ERROR_CODES.NOT_FOUND,
            t('media_not_found_message', { ns: 'error' }),
            t('media_not_found_details', { ns: 'error' }),
            t('media_not_found_suggestion', { ns: 'error' }),
        );
    }

    const { contentLength, byteMap, mimeType } = rendition;
    const range = parseRange(req.headers.range, contentLength);

    if (range === null && req.headers.range) {
        throw new ApiError(
            STATUS_CODES.RANGE_NOT_SATISFIABLE,
            ERROR_CODES.RANGE_NOT_SATISFIABLE,
            t('range_not_satisfiable_message', { ns: 'error' }),
            t('range_not_satisfiable_details', { ns: 'error' }),
            t('range_not_satisfiable_suggestion', { ns: 'error' }),
        );
    }

    if (range) {
        const { start, end } = range;
        const chunkLength = end - start + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${contentLength}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': chunkLength,
            'Content-Type': mimeType,
        });

        const streamer = new RangeStreamer({
            byteMap,
            range,
            chunkSize: manifest.chunkSize!,
            contentLength,
        });

        streamer.pipe(res);

        req.on('close', () => streamer.destroy());
    } else {
        res.writeHead(200, {
            'Content-Length': contentLength,
            'Content-Type': mimeType,
            'Accept-Ranges': 'bytes',
        });

        const streamer = new RangeStreamer({
            byteMap,
            range: { start: 0, end: contentLength - 1 },
            chunkSize: manifest.chunkSize!,
            contentLength,
        });

        streamer.pipe(res);
        req.on('close', () => streamer.destroy());
    }
});

export const listMedias = asyncCatch(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const t = req.t;

    const media = [];
    const ids: string[] = fs.readdirSync(env.media.MEDIA_DIR);

    for (const id of ids) {
        const fullManifest = await readManifest(id);

        if (!fullManifest) {
            continue;
        }

        media.push({
            id: fullManifest.id,
            title: fullManifest.title,
            tags: fullManifest.tags,
            kind: fullManifest.kind,
            status: fullManifest.status,
            createdAt: fullManifest.createdAt,
            thumbnailPath: fullManifest.thumbnailPath,
            quality: fullManifest.kind === 'video' ? fullManifest.renditions?.slice(-1)[0]?.quality : undefined,
        });
    }

    // Todo: implement pagination
    customSuccessResponse(res, 200, t('media_list_fetched_successfully'), {
        media,
    });
});
