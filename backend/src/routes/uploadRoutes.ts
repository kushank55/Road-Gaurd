import { Router } from 'express';
import FileUploadController, { upload } from '../controllers/fileUploadController';
import authenticateToken from '../middlewares/authMiddleware';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// File upload routes
router.post('/image', upload.single('image'), FileUploadController.uploadImage);
router.post('/images', upload.array('images', 5), FileUploadController.uploadMultipleImages);

// Cloudinary direct upload support
router.post('/signed-params', FileUploadController.getSignedUploadParams);

export default router;
