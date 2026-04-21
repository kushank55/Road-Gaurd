import React, { useState, useEffect } from 'react';
import { useParams,useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { workshopService } from '@/services/workshop.service';
import type { WorkshopDetails, Worker } from '@/services/workshop.service';
import { 
  ArrowLeft, 
  MapPin, 
  Star, 
  Phone, 
  Mail, 
  User, 
  Wrench, 
  CheckCircle, 
  XCircle,
  Calendar,
  StarIcon
} from 'lucide-react';
import LeafletMap from '@/components/LeafletMap';

const WorkshopMechDetailsPage: React.FC = () => {
  const { workshopId } = useParams<{ workshopId: string }>();
  const navigate = useNavigate();
  const [workshop, setWorkshop] = useState<WorkshopDetails | null>(null);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workshop details
  useEffect(() => {
    const fetchWorkshopDetails = async () => {
      if (!workshopId) {
        setError('Workshop ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // First get basic workshop info
        const workshopResponse = await workshopService.getWorkshopById(workshopId);
        
        if (workshopResponse.success) {
          // Then get detailed info including services and reviews
          const detailsResponse = await workshopService.getWorkshopDetails(workshopId);
          
          if (detailsResponse.success) {
            // Backend sometimes wraps payload in a 'workshop' key; coerce to any to safely read both shapes
            const dd: any = detailsResponse.data;
            setWorkshop(dd.workshop || dd);
          } else {
            // Fallback to basic workshop info if detailed info fails
            // Backend returns data wrapped in 'workshop' object for getWorkshopById too
            setWorkshop(workshopResponse.data.workshop || workshopResponse.data);
          }
        } else {
          setError(workshopResponse.message || 'Failed to fetch workshop details');
        }
      } catch (err) {
        console.error('Error fetching workshop details:', err);
        setError('An error occurred while fetching workshop details');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshopDetails();
  }, [workshopId]);

  // Fetch associated workers
  useEffect(() => {
    const fetchWorkers = async () => {
      if (!workshopId) return;

      try {
        setWorkersLoading(true);
        const response = await workshopService.getWorkshopWorkers(workshopId);
        
        if (response.success) {
          setWorkers(response.data);
        } else {
          console.error('Failed to fetch workers:', response.message);
        }
      } catch (err) {
        console.error('Error fetching workers:', err);
      } finally {
        setWorkersLoading(false);
      }
    };

    fetchWorkers();
  }, [workshopId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !workshop) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/managerShopPanel')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Manager Panel
          </Button>
        </div>
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">
              {error || 'Workshop not found'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Navigation */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/managerShopPanel')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Manager Panel
        </Button>
      </div>

      {/* Workshop Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
          {/* Workshop Image */}
          <div className="flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-border lg:w-80">
            <img
              src={workshop.image_url || "/placeholder.svg"}
              alt={`${workshop.name} photo`}
              className="h-64 w-full object-cover lg:h-80"
              loading="lazy"
            />
          </div>

          {/* Workshop Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {workshop.name}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <Badge 
                  variant={workshop.status === 'OPEN' ? 'default' : 'secondary'}
                  className={workshop.status === 'OPEN' ? 'bg-green-500 hover:bg-green-600' : ''}
                >
                  {workshop.status}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-medium">{workshop.rating}</span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">
                    Created: {new Date(workshop.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-foreground">{workshop.description}</p>
              
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-muted-foreground">{workshop.address}</span>
              </div>

              {workshop.owner && (
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Owner Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span>{workshop.owner.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{workshop.owner.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{workshop.owner.phone}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Map Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Workshop Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 rounded-lg overflow-hidden">
              {workshop.latitude && workshop.longitude ? (
                <LeafletMap
                  latitude={workshop.latitude}
                  longitude={workshop.longitude}
                  address={workshop.address}
                  radiusMeters={1000}
                  className="h-64 w-full"
                />
              ) : (
                <div className="h-64 w-full bg-muted/20 flex items-center justify-center rounded-lg">
                  <p className="text-muted-foreground">Location data not available</p>
                </div>
              )}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Address:</strong> {workshop.address || 'Not available'}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Coordinates:</strong> {workshop.latitude && workshop.longitude 
                  ? `${workshop.latitude}, ${workshop.longitude}` 
                  : 'Not available'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Associated Workers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Associated Mechanics
              </div>
              <Badge variant="secondary">
                {workers.length} mechanic{workers.length !== 1 ? 's' : ''}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {workersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : workers.length === 0 ? (
              <div className="text-center py-8">
                <Wrench className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No mechanics assigned to this workshop</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {workers.map((worker) => (
                  <div
                    key={worker.id}
                    className="flex items-start justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">{worker.name}</span>
                        <Badge
                          variant={worker.isAvailable ? 'default' : 'secondary'}
                          className={worker.isAvailable ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {worker.isAvailable ? (
                            <CheckCircle className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircle className="h-3 w-3 mr-1" />
                          )}
                          {worker.isAvailable ? 'Available' : 'Busy'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          <span>{worker.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          <span>{worker.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-3 w-3" />
                          <span className="font-medium">{worker.specialization}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Services & Reviews Section */}
      {(workshop.services || workshop.reviews) && (
        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Services */}
          {workshop.services && workshop.services.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Services Offered
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workshop.services.map((service) => (
                    <div
                      key={service.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold">{service.name}</h4>
                        <Badge variant="outline">{service.vehicle_model}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                      <div className="text-xs text-muted-foreground mt-2">
                        <span className="font-medium">Vehicle:</span> {service.vehicle_model} - {service.license_plate}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          {workshop.reviews && workshop.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StarIcon className="h-5 w-5" />
                  Customer Reviews
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {workshop.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-4 border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {review.user?.name || 'Anonymous'}
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                            <span className="text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {review.comment}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkshopMechDetailsPage;
