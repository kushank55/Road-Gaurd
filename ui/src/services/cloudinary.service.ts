import { Cloudinary } from 'cloudinary-core';

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
  url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
  signature: string;
}

export interface CloudinaryUploadParams {
  signature: string;
  timestamp: number;
  api_key: string;
  cloud_name: string;
  folder?: string;
}

class CloudinaryService {
  private static cloudinary: Cloudinary | null = null;

  /**
   * Initialize Cloudinary instance
   */
  private static getCloudinary(): Cloudinary {
    if (!this.cloudinary) {
      // For now, we'll use environment variables. In production, you might want to fetch this from your backend
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
      
      if (!cloudName) {
        throw new Error('Cloudinary cloud name not configured');
      }

      this.cloudinary = new Cloudinary({
        cloud_name: cloudName,
        secure: true
      });
    }
    return this.cloudinary;
  }

  /**
   * Get signed upload parameters from backend
   */
  static async getSignedUploadParams(folder?: string): Promise<CloudinaryUploadParams> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}/upload/signed-params`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ folder })
      });

      if (!response.ok) {
        throw new Error('Failed to get signed upload parameters');
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to get signed upload parameters');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting signed upload params:', error);
      throw error;
    }
  }

  /**
   * Upload image directly to Cloudinary
   */
  static async uploadImage(
    file: File, 
    folder?: string,
    onProgress?: (progress: number) => void
  ): Promise<CloudinaryUploadResponse> {
    try {
      // Get signed parameters from backend
      const params = await this.getSignedUploadParams(folder);

      // Create form data
      const formData = new FormData();
      formData.append('file', file);
      formData.append('signature', params.signature);
      formData.append('timestamp', params.timestamp.toString());
      formData.append('api_key', params.api_key);
      
      if (params.folder) {
        formData.append('folder', params.folder);
      }

      // Upload to Cloudinary
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Track upload progress
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              onProgress(progress);
            }
          });
        }

        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (error) {
              reject(new Error('Invalid response from Cloudinary'));
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              reject(new Error(errorResponse.error?.message || `Upload failed with status: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed with status: ${xhr.status}`));
            }
          }
        });

        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.open('POST', `https://api.cloudinary.com/v1_1/${params.cloud_name}/image/upload`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Upload multiple images to Cloudinary
   */
  static async uploadMultipleImages(
    files: File[],
    folder?: string,
    onProgress?: (fileIndex: number, progress: number) => void
  ): Promise<CloudinaryUploadResponse[]> {
    try {
      const uploadPromises = files.map((file, index) => 
        this.uploadImage(file, folder, (progress) => {
          if (onProgress) {
            onProgress(index, progress);
          }
        })
      );

      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading multiple images to Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Get optimized image URL
   */
  static getOptimizedImageUrl(publicId: string, options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string | number;
    format?: string;
  } = {}): string {
    try {
      const cloudinary = this.getCloudinary();
      
      const transformOptions = {
        quality: 'auto',
        format: 'auto',
        ...options
      };

      return cloudinary.url(publicId, transformOptions);
    } catch (error) {
      console.error('Error generating optimized image URL:', error);
      return '';
    }
  }

  /**
   * Generate thumbnail URL
   */
  static getThumbnailUrl(publicId: string, size: number = 200): string {
    return this.getOptimizedImageUrl(publicId, {
      width: size,
      height: size,
      crop: 'fill'
    });
  }
}

export default CloudinaryService;
