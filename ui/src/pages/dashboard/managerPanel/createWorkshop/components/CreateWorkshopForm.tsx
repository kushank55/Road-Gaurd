import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Toast } from '@/components/ui/toast';
import WorkshopLocationMap from '@/components/WorkshopLocationMap';
import { WorkshopService } from '@/services/workshop.service';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save, MapPin, Building, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { Trans } from '@/components/Trans';

interface CreateWorkshopFormProps {
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  description: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  image_url: string;
  status: 'OPEN' | 'CLOSED';
}

interface FormErrors {
  name?: string;
  description?: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  image_url?: string;
}

const CreateWorkshopForm: React.FC<CreateWorkshopFormProps> = ({ onSuccess }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const workshopService = WorkshopService.getInstance();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    address: '',
    latitude: null,
    longitude: null,
    image_url: '',
    status: 'OPEN'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  const statusOptions = [
    { value: 'OPEN', label: 'Open' },
    { value: 'CLOSED', label: 'Closed' }
  ];

  // Handle form field changes
  const handleInputChange = (field: keyof FormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // Handle location selection from map
  const handleLocationSelect = (lat: number, lng: number, address?: string) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      address: address || prev.address
    }));
    // Clear location-related errors
    setErrors(prev => ({
      ...prev,
      latitude: undefined,
      longitude: undefined,
      address: undefined
    }));
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Workshop name is required';
    } else if (formData.name.length < 2 || formData.name.length > 255) {
      newErrors.name = 'Workshop name must be between 2 and 255 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Workshop description is required';
    } else if (formData.description.length < 10 || formData.description.length > 2000) {
      newErrors.description = 'Workshop description must be between 10 and 2000 characters';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Workshop address is required';
    }

    if (formData.latitude === null || formData.longitude === null) {
      newErrors.latitude = 'Please select a location on the map';
    } else {
      if (formData.latitude < -90 || formData.latitude > 90) {
        newErrors.latitude = 'Invalid latitude';
      }
      if (formData.longitude < -180 || formData.longitude > 180) {
        newErrors.longitude = 'Invalid longitude';
      }
    }

    if (formData.image_url.trim() && !isValidUrl(formData.image_url)) {
      newErrors.image_url = 'Please enter a valid image URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setSubmitError('You must be logged in to create a workshop');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const workshopData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        latitude: formData.latitude!,
        longitude: formData.longitude!,
        image_url: formData.image_url.trim() || undefined,
        status: formData.status
      };

      const response = await workshopService.createWorkshop(workshopData);

      if (response.success) {
        // Show success message
        setShowSuccessMessage(true);
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          address: '',
          latitude: null,
          longitude: null,
          image_url: '',
          status: 'OPEN'
        });

        // Auto-hide success message and redirect after 2 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
          if (onSuccess) {
            onSuccess();
          } else {
            // Redirect to manager dashboard
            navigate('/managerShopPanel');
          }
        }, 2000);
      } else {
        setSubmitError(response.message || 'Failed to create workshop');
      }
    } catch (err) {
      console.error('Create workshop error:', err);
      // Normalize error to access common fields safely
      const errorAny = err as any;
      setSubmitError(
        errorAny?.response?.data?.message ||
        errorAny?.message ||
        'An error occurred while creating the workshop'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <Toast
          variant="success"
          onClose={() => setShowSuccessMessage(false)}
          className="mb-4"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            <span>
              <Trans 
                translationKey="workshop.create.successMessage" 
                text="Workshop created successfully! Redirecting to dashboard..." 
              />
            </span>
          </div>
        </Toast>
      )}

      {/* Error Message */}
      {submitError && (
        <Toast
          variant="destructive"
          onClose={() => setSubmitError('')}
          className="mb-4"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{submitError}</span>
          </div>
        </Toast>
      )}
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <Trans translationKey="workshop.create.basicInfo" text="Basic Information" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                <Trans translationKey="workshop.create.name" text="Workshop Name" /> *
              </Label>
              <Input
                id="name"
                placeholder="Enter workshop name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">
                <Trans translationKey="workshop.create.status" text="Status" />
              </Label>
              <Select
                options={statusOptions}
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              <Trans translationKey="workshop.create.description" text="Description" /> *
            </Label>
            <Textarea
              id="description"
              placeholder="Describe your workshop services, specialties, and what makes it unique..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className={`min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{formData.description.length}/2000 characters</span>
              {errors.description && (
                <span className="text-red-500">{errors.description}</span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">
              <Trans translationKey="workshop.create.imageUrl" text="Workshop Image URL" />
            </Label>
            <div className="relative">
              <Image className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="image_url"
                placeholder="https://example.com/workshop-image.jpg"
                value={formData.image_url}
                onChange={(e) => handleInputChange('image_url', e.target.value)}
                className={`pl-10 ${errors.image_url ? 'border-red-500' : ''}`}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter a direct link to an image file (e.g., .jpg, .png, .gif). Avoid search URLs or non-image links.
            </p>
            {errors.image_url && (
              <p className="text-sm text-red-500">{errors.image_url}</p>
            )}
            {formData.image_url && isValidUrl(formData.image_url) && (
              <div className="mt-2">
                <Label className="text-sm text-muted-foreground">Image Preview:</Label>
                <div className="mt-1 border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
                  <img
                    src={formData.image_url}
                    alt="Workshop preview"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Location Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <Trans translationKey="workshop.create.location" text="Location" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">
              <Trans translationKey="workshop.create.address" text="Address" /> *
            </Label>
            <Input
              id="address"
              placeholder="Enter workshop address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className={errors.address ? 'border-red-500' : ''}
            />
            {errors.address && (
              <p className="text-sm text-red-500">{errors.address}</p>
            )}
          </div>

          <div>
            <Label className="block mb-2">
              <Trans translationKey="workshop.create.selectLocation" text="Select Location on Map" /> *
            </Label>
            <WorkshopLocationMap
              latitude={formData.latitude || undefined}
              longitude={formData.longitude || undefined}
              onLocationSelect={handleLocationSelect}
            />
            {errors.latitude && (
              <p className="text-sm text-red-500 mt-2">{errors.latitude}</p>
            )}
          </div>

          {formData.latitude && formData.longitude && (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>
                  <Trans translationKey="workshop.create.latitude" text="Latitude" />
                </Label>
                <Input
                  value={formData.latitude.toFixed(6)}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
              <div className="space-y-2">
                <Label>
                  <Trans translationKey="workshop.create.longitude" text="Longitude" />
                </Label>
                <Input
                  value={formData.longitude.toFixed(6)}
                  readOnly
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/managerShopPanel')}
          disabled={isSubmitting}
        >
          <Trans translationKey="common.cancel" text="Cancel" />
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting || showSuccessMessage}
          className="min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <Trans translationKey="workshop.create.creating" text="Creating..." />
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              <Trans translationKey="workshop.create.submit" text="Create Workshop" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
};

export default CreateWorkshopForm;
