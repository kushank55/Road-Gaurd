import { Request, Response } from 'express';
import multer from 'multer';
import CloudinaryService from '../services/cloudinaryService';
import { IAuthenticatedRequest, IApiResponse } from '../types';

// Configure multer for memory storage (for Cloudinary upload)
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

class FileUploadController {
  // Upload single image to Cloudinary
  static async uploadImage(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          message: 'No file uploaded'
        } as IApiResponse);
        return;
      }

      // Upload to Cloudinary
      const result = await CloudinaryService.uploadImage(req.file.buffer, {
        folder: 'roadguard/services'
      });

      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully',
        data: {
          imageUrl: result.secure_url,
          publicId: result.public_id,
          originalName: req.file.originalname,
          size: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format
        }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload image',
        error: error.message
      } as IApiResponse);
    }
  }

  // Upload multiple images to Cloudinary
  static async uploadMultipleImages(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          message: 'No files uploaded'
        } as IApiResponse);
        return;
      }

      // Prepare files for Cloudinary upload
      const files = req.files.map((file: Express.Multer.File) => ({
        buffer: file.buffer,
        originalname: file.originalname
      }));

      // Upload to Cloudinary
      const results = await CloudinaryService.uploadMultipleImages(files, {
        folder: 'roadguard/services'
      });

      const uploadedFiles = results.map((result, index) => ({
        imageUrl: result.secure_url,
        publicId: result.public_id,
        originalName: (req.files as Express.Multer.File[])[index].originalname,
        size: result.bytes,
        width: result.width,
        height: result.height,
        format: result.format
      }));

      res.status(200).json({
        success: true,
        message: 'Images uploaded successfully',
        data: {
          images: uploadedFiles,
          count: uploadedFiles.length
        }
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error uploading images:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload images',
        error: error.message
      } as IApiResponse);
    }
  }

  // Generate signed upload parameters for direct client upload to Cloudinary
  static async getSignedUploadParams(req: IAuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Authentication required'
        } as IApiResponse);
        return;
      }

      const { folder = 'roadguard/services' } = req.body;

      const signedParams = CloudinaryService.generateSignedUploadParams({
        folder
      });

      res.status(200).json({
        success: true,
        message: 'Signed upload parameters generated',
        data: signedParams
      } as IApiResponse);
    } catch (error: any) {
      console.error('Error generating signed upload params:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate signed upload parameters',
        error: error.message
      } as IApiResponse);
    }
  }
}

export default FileUploadController;
