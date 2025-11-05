import { Request, Response } from 'express';

import { env } from '@/configs/env';
import { ERROR_CODES } from '@/constants/error.codes';
import { STATUS_CODES } from '@/constants/status.codes';
import { ApiError } from '@/errors/ApiError.error';
import asyncCatch from '@/errors/asyncCatch.error';
import { customSuccessResponse } from '@/utils/customSuccessResponse.util';

import packageJson from '../../package.json';

const appName = packageJson.name;
const appEnverionment = env.app.NODE_ENV;
const appVersion = packageJson.version;

export const root = asyncCatch(async (req: Request, res: Response) => {
    const t = req.t;
    /**
     * Check if the required environment variables are set
     * If not, throw an error
     */
    if (!appName || !appVersion || !appEnverionment) {
        throw new ApiError(
            STATUS_CODES.INVALID_JSON_CONFIG,
            ERROR_CODES.INVALID_JSON_CONFIG,
            t('invalid_package_message', { ns: 'error' }),
            t('invalid_package_details', { ns: 'error' }),
            t('invalid_package_suggestion', { ns: 'error' }),
        );
    }

    /**
     * Send a welcome message with the app name, version, and environment
     */
    customSuccessResponse(res, 200, t('welcome'), {
        appName,
        appVersion,
        appEnverionment,
    });
});
