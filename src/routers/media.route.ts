import { Router } from 'express';

import { handleMediaUpload, serveImage, streamVideo } from '@/controllers/media.controller';
import createUploadMiddleware from '@/middlewares/multer.middleware';
import validateSchema from '@/middlewares/schema.validation.middleware';
import { getImageSchema, playVideoSchema, uploadMediaSchema } from '@/schemas/media.schema';

const mediaRouter = Router();

const upload = createUploadMiddleware({
    maxFileSize: 100 * 1024 * 1024, // 100MB
    maxFiles: 1,
});

mediaRouter.post('/upload', upload.single('media_file'), validateSchema(uploadMediaSchema), handleMediaUpload);

mediaRouter.get('/image/:id', validateSchema(getImageSchema), serveImage);
mediaRouter.get('/video/:id/stream', validateSchema(playVideoSchema), streamVideo);

export { mediaRouter };
