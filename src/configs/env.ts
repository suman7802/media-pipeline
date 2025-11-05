import dotenvFlow from 'dotenv-flow';

import logger from '@/loggers/winston.logger';
import { envSchema } from '@/schemas/env.schema';

dotenvFlow.config();

const parsedEnv = envSchema.safeParse({
    app: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        LOG_LEVEL: process.env.LOG_LEVEL,
        CLIENT_URL: process.env.CLIENT_URL,
        API_KEY: process.env.API_KEY,
        DISABLE_RATE_LIMITER: process.env.DISABLE_RATE_LIMITER,
        DISABLE_VALIDATE_API_KEY_ON_DEVELOPMENT: process.env.DISABLE_VALIDATE_API_KEY_ON_DEVELOPMENT,
        ENABLE_DETAIL_ERROR_LOGGING: process.env.ENABLE_DETAIL_ERROR_LOGGING,
    },

    media: {
        MEDIA_DIR: process.env.MEDIA_DIR,
        RAW_DIR: process.env.RAW_DIR,
        TEMP_UPLOAD_PATH: process.env.TEMP_UPLOAD_PATH,
        FFMPEG_PATH: process.env.FFMPEG_PATH,
    },

    queue: {
        QUEUE_DIR: process.env.QUEUE_DIR,
    },
});

/**
 * Check if the environment variables are valid
 * If not, log the error and exit the process
 */
if (!parsedEnv.success) {
    logger.error(parsedEnv.error.errors);
    process.exit(1);
}

export const env = parsedEnv.data;
