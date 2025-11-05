import { z } from 'zod';

/**
 * @description
 *  truthy values are values that are considered true
 *  in the context of environment variables
 */
const TRUTHY_VALUES = ['true', 't', '1'];

export const envSchema = z.object({
    app: z.object({
        NODE_ENV: z.enum(['development', 'production', 'test']),
        PORT: z.string().transform(Number),
        /***
         * log levels are options according to morgan
         *  for more info visit https://github.com/expressjs/morgan#readme
         */
        LOG_LEVEL: z.enum(['dev', 'short', 'combined', 'common', 'short', 'tiny']),
        CLIENT_URL: z.string().url(),
        API_KEY: z.string(),
        DISABLE_RATE_LIMITER: z.string().transform((val) => {
            return TRUTHY_VALUES.includes(val.toLowerCase());
        }),
        DISABLE_VALIDATE_API_KEY_ON_DEVELOPMENT: z.string().transform((val) => {
            return TRUTHY_VALUES.includes(val.toLowerCase());
        }),
        ENABLE_DETAIL_ERROR_LOGGING: z.string().transform((val) => {
            return TRUTHY_VALUES.includes(val.toLowerCase());
        }),
    }),

    media: z.object({
        MEDIA_DIR: z.string(),
        RAW_DIR: z.string(),
        TEMP_UPLOAD_PATH: z.string(),
        FFMPEG_PATH: z.string().optional(),
    }),

    queue: z.object({
        QUEUE_DIR: z.string(),
    }),
});

export type envType = z.TypeOf<typeof envSchema>;
