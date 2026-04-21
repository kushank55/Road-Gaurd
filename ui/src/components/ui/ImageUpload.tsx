import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CloudinaryService from '@/services/cloudinary.service';
import type { CloudinaryUploadResponse } from '@/services/cloudinary.service';

interface ImageUploadProps {
  images: CloudinaryUploadResponse[];
  onImagesChange: (images: CloudinaryUploadResponse[]) => void;
  maxImages?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  folder?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadProgress {
  [key: string]: number;
}

export default function ImageUpload({
  images = [],
  onImagesChange,
  maxImages = 5,
  maxSizeInMB = 5,
  acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  folder = 'roadguard/services',
  disabled = false,
  className = ''
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({});
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate files
    const validationError = validateFiles(files);
    if (validationError) {
      setError(validationError);
      return;
    }

    uploadFiles(files);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const validateFiles = (files: File[]): string | null => {
    // Check if total number of images exceeds limit
    if (images.length + files.length > maxImages) {
      return `You can upload a maximum of ${maxImages} images. Current: ${images.length}, Trying to add: ${files.length}`;
    }

    // Validate file types
    const invalidFiles = files.filter(file => !acceptedTypes.includes(file.type));
    if (invalidFiles.length > 0) {
      return `Invalid file types detected. Only ${acceptedTypes.join(', ')} are allowed.`;
    }

    // Validate file sizes
    const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
    const oversizedFiles = files.filter(file => file.size > maxSizeInBytes);
    if (oversizedFiles.length > 0) {
      return `Some files are too large. Maximum size allowed: ${maxSizeInMB}MB`;
    }

    return null;
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    setError(null);
    
    try {
      const uploadedImages = await CloudinaryService.uploadMultipleImages(
        files,
        folder,
        (fileIndex, progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [fileIndex]: progress
          }));
        }
      );

      onImagesChange([...images, ...uploadedImages]);
      setUploadProgress({});
    } catch (error: any) {
      setError(error.message || 'Failed to upload images');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    onImagesChange(updatedImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            border-2 border-dashed border-gray-300 rounded-lg p-6 text-center 
            hover:border-gray-400 transition-colors cursor-pointer
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${uploading ? 'pointer-events-none' : ''}
          `}
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          <div className="flex flex-col items-center space-y-2">
            {uploading ? (
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 text-gray-400" />
            )}
            
            <div className="text-sm">
              {uploading ? (
                <span className="text-blue-600">Uploading images...</span>
              ) : (
                <>
                  <span className="text-gray-600">
                    Drag and drop images here, or{' '}
                  </span>
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 underline"
                    disabled={disabled || uploading}
                  >
                    browse
                  </button>
                </>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              {maxImages - images.length} more image{maxImages - images.length !== 1 ? 's' : ''} allowed
              <br />
              Max {maxSizeInMB}MB per image
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="text-red-800 text-sm">{error}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-700 p-0 h-auto mt-1"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Upload Progress */}
      {uploading && Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(uploadProgress).map(([fileIndex, progress]) => (
            <div key={fileIndex} className="bg-gray-50 rounded-md p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">Uploading image {parseInt(fileIndex) + 1}</span>
                <span className="text-sm text-gray-600">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.public_id || index} className="overflow-hidden">
              <CardContent className="p-0 relative group">
                <img
                  src={CloudinaryService.getThumbnailUrl(image.public_id, 200)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
                
                {/* Remove Button */}
                <button
                  onClick={() => removeImage(index)}
                  className="
                    absolute top-2 right-2 bg-red-500 hover:bg-red-600 
                    text-white rounded-full w-6 h-6 flex items-center justify-center
                    opacity-0 group-hover:opacity-100 transition-opacity
                  "
                  disabled={disabled}
                  type="button"
                >
                  <X size={12} />
                </button>

                {/* Image Info Overlay */}
                <div className="
                  absolute inset-x-0 bottom-0 bg-black bg-opacity-75 
                  text-white p-2 text-xs opacity-0 group-hover:opacity-100 
                  transition-opacity
                ">
                  <div className="flex items-center space-x-1">
                    <ImageIcon size={12} />
                    <span>{(image.bytes / 1024).toFixed(0)}KB</span>
                    <span>•</span>
                    <span>{image.width}×{image.height}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Image Count Info */}
      {images.length > 0 && (
        <div className="text-sm text-gray-600 text-center">
          {images.length} of {maxImages} images uploaded
        </div>
      )}
    </div>
  );
}
