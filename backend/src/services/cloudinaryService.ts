import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';

config();

// Validate required environment variables
if (!process.env['CLOUDINARY_CLOUD_NAME'] || !process.env['CLOUDINARY_API_KEY'] || !process.env['CLOUDINARY_API_SECRET']) {
  console.error('Missing required Cloudinary environment variables');
  console.error('Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env['CLOUDINARY_CLOUD_NAME'] || '',
  api_key: process.env['CLOUDINARY_API_KEY'] || '',
  api_secret: process.env['CLOUDINARY_API_SECRET'] || ''
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface CloudinaryOptions {
  folder?: string;
  transformation?: any[];
  quality?: string | number;
  format?: string;
}

class CloudinaryService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    fileBuffer: Buffer, 
    options: CloudinaryOptions = {}
  ): Promise<CloudinaryUploadResult> {
    try {
      const defaultOptions = {
        folder: 'roadguard/services',
        quality: 'auto',
        format: 'auto',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        ...options
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          defaultOptions,
          (error: any, result: any) => {
            if (error) {
              console.error('Cloudinary upload error:', error);
              reject(error);
            } else if (result) {
              resolve(result as CloudinaryUploadResult);
            } else {
              reject(new Error('Unknown Cloudinary upload error'));
            }
          }
        ).end(fileBuffer);
      });
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: { buffer: Buffer; originalname: string }[],
    options: CloudinaryOptions = {}
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map((file) => 
        this.uploadImage(file.buffer, options)
      );
      
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Error deleting image from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Delete multiple images from Cloudinary
   */
  static async deleteMultipleImages(publicIds: string[]): Promise<any> {
    try {
      return await cloudinary.api.delete_resources(publicIds);
    } catch (error) {
      console.error('Error deleting multiple images from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate signed upload parameters for direct client upload
   */
  static generateSignedUploadParams(options: CloudinaryOptions = {}): {
    signature: string;
    timestamp: number;
    api_key: string;
    cloud_name: string;
    folder?: string;
  } {
    try {
      // Validate required environment variables
      if (!process.env['CLOUDINARY_API_SECRET'] || !process.env['CLOUDINARY_API_KEY'] || !process.env['CLOUDINARY_CLOUD_NAME']) {
        throw new Error('Missing required Cloudinary environment variables');
      }

      const timestamp = Math.round(new Date().getTime() / 1000);
      const params = {
        timestamp,
        folder: options.folder || 'roadguard/services',
        ...options
      };

      // Create signature string with all parameters
      const signatureParams = {
        timestamp: params.timestamp,
        folder: params.folder
      };

      const signature = cloudinary.utils.api_sign_request(signatureParams, process.env['CLOUDINARY_API_SECRET']);

      return {
        signature,
        timestamp,
        api_key: process.env['CLOUDINARY_API_KEY'],
        cloud_name: process.env['CLOUDINARY_CLOUD_NAME'],
        folder: params.folder
      };
    } catch (error) {
      console.error('Error generating signed upload params:', error);
      throw error;
    }
  }

  /**
   * Get optimized image URL with transformations
   */
  static getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}): string {
    try {
      const defaultOptions = {
        quality: 'auto',
        format: 'auto',
        ...options
      };

      return cloudinary.url(publicId, defaultOptions);
    } catch (error) {
      console.error('Error generating optimized image URL:', error);
      throw error;
    }
  }
}

export default CloudinaryService;
