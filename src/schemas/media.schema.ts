import { z } from 'zod';

import { IMAGE_FORMATS, IMAGE_SIZES, VIDEO_LADDER } from '@/configs/media.config';

const MediaId = z.string().ulid();
const VideoQualityEnum = z.enum(VIDEO_LADDER.map((v) => v.quality) as [string, ...string[]]);

const ImageFormatEnum = z.enum(IMAGE_FORMATS as [string, ...string[]]);
const ImageSizeEnum = z.coerce.number().refine((val) => IMAGE_SIZES.includes(val as any), {
    message: `Invalid image size. Must be one of: ${IMAGE_SIZES.join(', ')}`,
});

export const uploadMediaSchema = z.object({
    body: z.object({
        kind: z.enum(['video', 'image']),
        title: z.string().min(1, 'Title is required').max(100),
        tags: z
            .union([z.string(), z.array(z.string())])
            .optional()
            .transform((val) => {
                if (Array.isArray(val)) return val;
                if (typeof val === 'string') return [val];
                return [];
            }),
    }),
});

const BaseManifestSchema = z.object({
    id: MediaId,
    title: z.string(),
    tags: z.array(z.string()),
    status: z.enum(['queued', 'processing', 'completed', 'failed']),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime().optional(),
    originalFilename: z.string(),
    error: z.string().optional(),
    rawFilePath: z.string().optional(),
});

const VideoRenditionSchema = z.object({
    quality: VideoQualityEnum,
    resolution: z.object({ width: z.number(), height: z.number() }),
    contentLength: z.number(),
    mimeType: z.literal('video/mp4'),
    byteMap: z.array(
        z.object({
            offset: z.number(),
            size: z.number(),
            path: z.string(),
        }),
    ),
});

const VideoManifestSchema = BaseManifestSchema.extend({
    kind: z.literal('video'),
    chunkSize: z.number().optional(),
    renditions: z.array(VideoRenditionSchema).optional(),
    thumbnailPath: z.string().optional(),
});

export const playVideoSchema = z.object({
    params: z.object({
        id: MediaId,
    }),

    query: z.object({
        quality: VideoQualityEnum,
    }),

    headers: z
        .object({
            range: z.string().optional(),
        })
        .passthrough(),
});

const ImageRenditionSchema = z.object({
    size: ImageSizeEnum,
    format: ImageFormatEnum,
    path: z.string(),
    contentLength: z.number(),
    resolution: z.object({ width: z.number(), height: z.number() }),
});

const ImageManifestSchema = BaseManifestSchema.extend({
    kind: z.literal('image'),
    images: z.array(ImageRenditionSchema).optional(),
});

export const getImageSchema = z.object({
    params: z.object({
        id: MediaId,
    }),
    query: z.object({
        size: ImageSizeEnum,
        format: ImageFormatEnum,
    }),
});

export const MediaManifestSchema = z.discriminatedUnion('kind', [VideoManifestSchema, ImageManifestSchema]);

export type MediaManifest = z.infer<typeof MediaManifestSchema>;
export type uploadMediaType = z.infer<typeof uploadMediaSchema>['body'];
export type MediaKind = z.infer<typeof uploadMediaSchema>['body']['kind'];
export type VideoRendition = z.infer<typeof VideoRenditionSchema>;
export type ImageSize = z.infer<typeof ImageSizeEnum>;
export type ImageFormat = z.infer<typeof ImageFormatEnum>;
export type ImageRendition = z.infer<typeof ImageRenditionSchema>;
export type VideoQuality = z.infer<typeof VideoQualityEnum>;
export type PlayVideo = z.infer<typeof playVideoSchema>;
export type GetImage = z.infer<typeof getImageSchema>;
