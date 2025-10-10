import { Request } from 'express';
import sgMail from '@sendgrid/mail';
import fs from 'fs/promises';
import Handlebars from 'handlebars';
import path from 'path';

import { env } from '@/config/env';
import { ERROR_CODES } from '@/constant/error.codes';
import { STATUS_CODES } from '@/constant/status.codes';
import { ApiError } from '@/error/ApiError';
import logger from '@/logger/winston.logger';

sgMail.setApiKey(env.sendgrid.SEND_GRID_API_KEY);
interface SendLocalEmailOptions {
    to: string;
    subject: string;
    templatePath: string;
    dynamicData: Record<string, any>;
}

export const sendEmail = async (req: Request, options: SendLocalEmailOptions) => {
    const t = req.t;

    try {
        const templateFile = path.resolve(
            __dirname,
            '../email/templates',
            options.templatePath, // supports nested paths like 'example/notification.template.html'
        );

        const templateContent = await fs.readFile(templateFile, 'utf-8');

        const compiledTemplate = Handlebars.compile(templateContent);
        const htmlContent = compiledTemplate(options.dynamicData);

        return await sgMail.send({
            to: options.to,
            from: env.sendgrid.SEND_GRID_FROM_EMAIL,
            subject: options.subject,
            html: htmlContent,
        });
    } catch (error) {
        logger.error(error);
        throw new ApiError(
            STATUS_CODES.GENERAL_ERROR,
            ERROR_CODES.GENERAL_ERROR,
            t('email_not_sent_message', { ns: 'error' }),
            t('email_not_sent_details', { ns: 'error' }),
            t('email_not_sent_suggestion', { ns: 'error' }),
        );
    }
};
