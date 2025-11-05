import { z } from 'zod';

const MediaId = z.string().ulid();

export const VideoJobSchema = z.object({
    kind: z.literal('video'),
    mediaId: MediaId,
    rawFilePath: z.string(),
});

export const ImageJobSchema = z.object({
    kind: z.literal('image'),
    mediaId: MediaId,
    rawFilePath: z.string(),
});

export const JobSchema = z.discriminatedUnion('kind', [VideoJobSchema, ImageJobSchema]);

export type ImageJob = z.infer<typeof ImageJobSchema>;
export type VideoJob = z.infer<typeof VideoJobSchema>;
export type Job = z.infer<typeof JobSchema>;
