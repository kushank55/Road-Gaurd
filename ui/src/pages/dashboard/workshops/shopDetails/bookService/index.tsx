import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, MapPin, User, Phone, Mail, Wrench, Navigation } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useWorkshopDetails } from '@/hooks/useWorkshopDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import ImageUpload from '@/components/ui/ImageUpload';
import type { CloudinaryUploadResponse } from '@/services/cloudinary.service';
import { serviceRequestService } from '@/services/serviceRequest.service';

// Import Leaflet (add to your package.json dependencies)
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Leaflet with webpack
// @ts-ignore - Ignoring TypeScript error for legacy Leaflet icon handling
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface BookServiceForm {
  serviceType: string;
  description: string;
  preferredDate: string;
  preferredTime: string;
  vehicleModel: string;
  vehiclePlate: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  images: CloudinaryUploadResponse[];
  locationAddress: string;
  locationLatitude: number;
  locationLongitude: number;
}

// Location Map Component
const LocationMap: React.FC<{
  latitude: number;
  longitude: number;
  address: string;
  onLocationChange: (lat: number, lng: number, address: string) => void;
  disabled?: boolean;
}> = ({ latitude, longitude, address, onLocationChange, disabled = false }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView([latitude, longitude], 13);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add initial marker
    const marker = L.marker([latitude, longitude], {
      draggable: !disabled
    }).addTo(map);

    if (!disabled) {
      // Handle marker drag
      marker.on('dragend', async (e) => {
        const position = e.target.getLatLng();
        await reverseGeocode(position.lat, position.lng);
      });

      // Handle map clicks
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        await reverseGeocode(lat, lng);
      });
    }

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, []);

  // Update marker position when coordinates change
  useEffect(() => {
    if (markerRef.current && (latitude !== 0 || longitude !== 0)) {
      markerRef.current.setLatLng([latitude, longitude]);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([latitude, longitude], 13);
      }
    }
  }, [latitude, longitude]);

  // Reverse geocoding function
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      setIsLoadingLocation(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      onLocationChange(lat, lng, address);
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      onLocationChange(lat, lng, `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setIsLoadingLocation(false);
    }
  };

  // Get current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 15);
        }
        
        reverseGeocode(lat, lng);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoadingLocation(false);
        alert('Unable to get your location. Please click on the map to set your location.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label>Service Location</Label>
        {!disabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={isLoadingLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="h-3 w-3" />
            {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
          </Button>
        )}
      </div>
      
      <div 
        ref={mapRef} 
        className="w-full h-64 border border-gray-300 rounded-lg"
        style={{ minHeight: '256px' }}
      />
      
      <div className="text-sm text-muted-foreground">
        {!disabled && (
          <p className="mb-2">
            📍 Click on the map or drag the marker to set your service location
          </p>
        )}
        <div className="flex items-start gap-2">
          <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span className="break-words">
            {isLoadingLocation ? 'Loading address...' : address || 'Click on map to select location'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default function BookServicePage() {
  const { shopId, user_id } = useParams<{ shopId: string; user_id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { workshop, loading, error } = useWorkshopDetails(shopId || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [formData, setFormData] = useState<BookServiceForm>({
    serviceType: '',
    description: '',
    preferredDate: '',
    preferredTime: '',
    vehicleModel: '',
    vehiclePlate: '',
    urgency: 'MEDIUM',
    images: [],
    locationAddress: '',
    locationLatitude: 28.6139, // Default to Delhi, India
    locationLongitude: 77.2090
  });

  // Redirect if not authenticated or user ID doesn't match
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!shopId || !user_id) {
      navigate('/workshops');
      return;
    }

    // Verify user ID matches authenticated user
    if (user && user.id.toString() !== user_id) {
      navigate('/unauthorized');
      return;
    }
  }, [isAuthenticated, shopId, user_id, user, navigate]);

  const handleInputChange = (field: keyof BookServiceForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear errors when user starts typing
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleImagesChange = (images: CloudinaryUploadResponse[]) => {
    setFormData(prev => ({
      ...prev,
      images
    }));
    
    // Clear error if successful
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleLocationChange = (lat: number, lng: number, address: string) => {
    setFormData(prev => ({
      ...prev,
      locationLatitude: lat,
      locationLongitude: lng,
      locationAddress: address
    }));

    // Clear errors when location is updated
    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!shopId || !user_id || !user) {
      setSubmitError('Missing required information');
      return;
    }

    // Basic validation
    if (!formData.serviceType || !formData.description || !formData.preferredDate) {
      setSubmitError('Please fill in all required fields');
      return;
    }

    // Description word count validation
    const wordCount = formData.description.trim().split(/\s+/).length;
    if (wordCount < 10) {
      setSubmitError('Please provide a more detailed description (at least 10 words)');
      return;
    }

    // Location validation
    if (!formData.locationAddress || formData.locationLatitude === 0 || formData.locationLongitude === 0) {
      setSubmitError('Please select a service location on the map');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Prepare service request data with Cloudinary image URLs and location
      const serviceRequestData = {
        workshop_id: shopId, // Include the workshop ID
        name: `${formData.serviceType} - ${formData.vehicleModel}`,
        description: formData.description,
        service_type: 'INSTANT_SERVICE' as const, // or 'PRE_BOOK_SLOTS' based on user selection
        priority: formData.urgency,
        location_address: formData.locationAddress,
        location_latitude: formData.locationLatitude,
        location_longitude: formData.locationLongitude,
        scheduled_start_time: formData.preferredDate ? new Date(`${formData.preferredDate}T${formData.preferredTime || '09:00'}`).toISOString() : undefined,
        scheduled_end_time: undefined,
        issue_description: formData.description,
        image_urls: formData.images.map(img => img.secure_url) // Extract Cloudinary URLs
      };

      console.log('Creating service request with data:', serviceRequestData);
      console.log('Workshop ID being sent:', shopId);

      // Make actual API call to create service request
      const response = await serviceRequestService.createServiceRequest(serviceRequestData);

      if (response.success) {
        console.log('Service request created successfully:', response.data);
        setSubmitSuccess(true);
        
        // Redirect to success page or back to workshop details after 2 seconds
        setTimeout(() => {
          navigate(`/workshops/shop/${shopId}`);
        }, 2000);
      } else {
        console.error('Service request creation failed:', response.message);
        setSubmitError(response.message || 'Failed to book service');
      }

    } catch (error: any) {
      console.error('Failed to book service:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to book service';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-lg">Loading workshop details...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !workshop) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-lg text-red-600">Workshop not found</div>
          <Button onClick={() => navigate('/workshops')} variant="outline">
            Back to Workshops
          </Button>
        </div>
      </main>
    );
  }

  if (submitSuccess) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Service Booked Successfully!</h2>
            <p className="text-muted-foreground">
              Your service request has been submitted to {workshop.name}.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              The workshop will contact you soon to confirm the appointment.
            </p>
          </div>
          <Button onClick={() => navigate(`/workshops/shop/${shopId}`)} className="mt-4">
            Back to Workshop
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/workshops/shop/${shopId}`)}
            className="p-2"
            aria-label="Back to workshop details"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Book Service</h1>
            <p className="text-muted-foreground">Schedule a service with {workshop.name}</p>
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Section - Booking Form */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Error Message */}
                {submitError && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <p className="text-sm text-red-800">{submitError}</p>
                  </div>
                )}

                {/* Service Type */}
                <div className="space-y-2">
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    required
                    options={[
                      { value: '', label: 'Select service type' },
                      { value: 'general-repair', label: 'General Repair' },
                      { value: 'oil-change', label: 'Oil Change' },
                      { value: 'brake-service', label: 'Brake Service' },
                      { value: 'tire-service', label: 'Tire Service' },
                      { value: 'engine-repair', label: 'Engine Repair' },
                      { value: 'electrical-repair', label: 'Electrical Repair' },
                      { value: 'ac-service', label: 'AC Service' },
                      { value: 'transmission-repair', label: 'Transmission Repair' },
                      { value: 'diagnostic', label: 'Diagnostic' },
                      { value: 'other', label: 'Other' }
                    ]}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Problem Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Please describe the issue or service needed..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="min-h-[100px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Be as detailed as possible to help the workshop understand your needs
                  </p>
                </div>

                {/* Service Location Map */}
                <div className="space-y-2">
                  <LocationMap
                    latitude={formData.locationLatitude}
                    longitude={formData.locationLongitude}
                    address={formData.locationAddress}
                    onLocationChange={handleLocationChange}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Vehicle Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="vehicleModel">Vehicle Model</Label>
                    <Input
                      id="vehicleModel"
                      placeholder="e.g., Toyota Camry 2020"
                      value={formData.vehicleModel}
                      onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vehiclePlate">License Plate</Label>
                    <Input
                      id="vehiclePlate"
                      placeholder="e.g., ABC-1234"
                      value={formData.vehiclePlate}
                      onChange={(e) => handleInputChange('vehiclePlate', e.target.value)}
                    />
                  </div>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="preferredDate">Preferred Date *</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Input
                      id="preferredTime"
                      type="time"
                      value={formData.preferredTime}
                      onChange={(e) => handleInputChange('preferredTime', e.target.value)}
                    />
                  </div>
                </div>

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="images">Upload Images</Label>
                  <ImageUpload
                    images={formData.images}
                    onImagesChange={handleImagesChange}
                    maxImages={5}
                    maxSizeInMB={5}
                    folder="roadguard/services"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    Photos help the workshop better understand your issue. You can upload images of the problem area, vehicle damage, or any relevant details.
                  </p>
                </div>

                {/* Urgency */}
                <div className="space-y-2">
                  <Label htmlFor="urgency">Urgency Level</Label>
                  <Select
                    value={formData.urgency}
                    onChange={(e) => handleInputChange('urgency', e.target.value)}
                    options={[
                      { value: 'LOW', label: 'Low - Can wait a few days' },
                      { value: 'MEDIUM', label: 'Medium - Within this week' },
                      { value: 'HIGH', label: 'High - As soon as possible' }
                    ]}
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Booking Service...
                      </>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4 mr-2" />
                        Book Service
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Workshop Info & User Info */}
        <div className="space-y-6">
          {/* Workshop Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Workshop Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold">{workshop.name}</h3>
                {workshop.status && (
                  <Badge 
                    variant={workshop.status === 'OPEN' ? 'default' : 'secondary'}
                    className={workshop.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                  >
                    {workshop.status}
                  </Badge>
                )}
              </div>
              
              {workshop.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span>{workshop.address}</span>
                </div>
              )}

              {workshop.owner && (
                <div className="space-y-2 pt-2 border-t">
                  <h4 className="text-sm font-medium">Contact Information</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {workshop.owner.name && (
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{workshop.owner.name}</span>
                      </div>
                    )}
                    {workshop.owner.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <span>{workshop.owner.phone}</span>
                      </div>
                    )}
                    {workshop.owner.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <span>{workshop.owner.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* User Information */}
          {user && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Your Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>{user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-3 w-3 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{user.phone}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Booking Info */}
          <Card>
            <CardContent className="p-6">
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 text-blue-500 mx-auto" />
                <h3 className="font-semibold">Quick Response</h3>
                <p className="text-sm text-muted-foreground">
                  The workshop typically responds to booking requests within 2-4 hours during business hours.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}