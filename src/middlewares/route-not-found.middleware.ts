import type { Request, Response } from 'express';

import { ERROR_CODES } from '@/constants/error.codes';
import { STATUS_CODES } from '@/constants/status.codes';
import { ApiError } from '@/errors/ApiError.error';
import logger from '@/loggers/winston.logger';

/**
 * Route not found handler
 * @param req Request
 * @param _res Response
 * @returns void
 */
export const routeNotFoundHandler = (req: Request, res: Response) => {
    const t = req.t;

    logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);

    throw new ApiError(
        STATUS_CODES.ROUTE_NOT_FOUND,
        ERROR_CODES.ROUTE_NOT_FOUND,
        t('route_not_found_message', { ns: 'error' }),
        t('route_not_found_details', { ns: 'error' }),
        t('route_not_found_suggestion', { ns: 'error' }),
    );
};
