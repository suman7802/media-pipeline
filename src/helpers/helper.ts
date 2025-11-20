import { Request } from 'express';

import { ERROR_CODES } from '@/constants/error.codes';
import { STATUS_CODES } from '@/constants/status.codes';
import { ApiError } from '@/errors/ApiError.error';

export type MediaType = 'image' | 'video';

/**
 * Determines the media type of the input, which can be either a File object, an Express.Multer.File object, a raw MIME string, or a file path.
 *
 * @param {Request} request - The Express request object.
 * @param {File | Express.Multer.File | string} input - The input to determine the media type of.
 * @returns {MediaType} - The media type of the input, either 'image' or 'video'.
 * @throws {ApiError} - If the input is of an unsupported media type, an ApiError is thrown with a 400 status code and BAD_REQUEST error code.
 */
export function getMediaType(request: Request, input: File | Express.Multer.File | string): MediaType {
    const t = request.t;
    let mime = '';
    let ext = '';

    // 1. Browser File object
    if (typeof File !== 'undefined' && input instanceof File) {
        mime = input.type;
        ext = input.name.split('.').pop()?.toLowerCase() || '';
    }

    // 2. Multer file
    else if (typeof input === 'object' && 'mimetype' in input) {
        mime = input.mimetype;
        ext = input.originalname?.split('.').pop()?.toLowerCase() || '';
    }

    // 3. Raw MIME string
    else if (typeof input === 'string' && input.includes('/')) {
        mime = input;
    }

    // 4. File path
    else if (typeof input === 'string') {
        ext = input.split('.').pop()?.toLowerCase() || '';
    }

    // Validate via MIME
    if (mime) {
        if (mime.startsWith('image/')) return 'image';
        if (mime.startsWith('video/')) return 'video';
    }

    // Validate via extension
    const imageExt = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExt = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv'];

    if (ext && imageExt.includes(ext)) return 'image';
    if (ext && videoExt.includes(ext)) return 'video';

    //  Unsupported media → throw error
    throw new ApiError(
        STATUS_CODES.BAD_REQUEST,
        ERROR_CODES.BAD_REQUEST,
        t('media_type_not_supported_message', { ns: 'error' }),
        t('media_type_not_supported_details', { ns: 'error' }),
        t('media_type_not_supported_suggestion', { ns: 'error' }),
    );
}

export interface RangeHeader {
    start: number;
    end: number;
}
/**
 * Parses the HTTP Range header.
 * @param {string} rangeHeader - The value of the `Range` header (e.g., 'bytes=0-1023').
 * @param {number} totalSize - The total size of the content in bytes.
 * @returns {{ start: number; end: number } | null} The parsed start and end bytes, or null if invalid.
 */
export const parseRange = (rangeHeader: string | undefined, totalSize: number): RangeHeader | null => {
    if (!rangeHeader) return null;

    const match = rangeHeader.match(/^bytes=(\d+)-(\d*)$/);
    if (!match) return null;

    const start = parseInt(match[1], 10);
    const end = match[2] ? parseInt(match[2], 10) : totalSize - 1;

    if (isNaN(start) || isNaN(end) || start > end || start >= totalSize) return null; // Invalid range, will trigger a 416

    return { start, end: Math.min(end, totalSize - 1) };
};
