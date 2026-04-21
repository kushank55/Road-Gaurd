import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { workshopService } from '@/services/workshop.service';
import type { Workshop } from '@/services/workshop.service';
import { Link } from 'react-router-dom';
import { Plus, MapPin, Star, Clock, Trash2, Eye } from 'lucide-react';

const ManagerShopPanel: React.FC = () => {
  const { user } = useAuth();
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workshops owned by the current user
  useEffect(() => {
    const fetchWorkshops = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await workshopService.getWorkshopsByOwnerId(user.id.toString());
        
        console.log('Workshop service response:', response);
        
        if (response.success && response.data) {
          console.log('Setting workshops:', response.data);
          setWorkshops(response.data || []);
        } else {
          console.log('Error response:', response.message);
          setError(response.message || 'Failed to fetch workshops');
          setWorkshops([]);
        }
      } catch (err) {
        console.error('Error fetching workshops:', err);
        setError('An error occurred while fetching workshops');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkshops();
  }, [user?.id]);

  const handleDeleteWorkshop = async (workshopId: string) => {
    if (!confirm('Are you sure you want to delete this workshop? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await workshopService.deleteWorkshop(workshopId);
      if (response.success) {
        setWorkshops(prev => prev.filter(w => w.id !== workshopId));
      } else {
        alert('Failed to delete workshop: ' + response.message);
      }
    } catch (err) {
      console.error('Error deleting workshop:', err);
      alert('An error occurred while deleting the workshop');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              Shop Manager Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">
              Welcome back, {user?.name}! Manage your workshop operations and team.
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link to="/managerShopPanel/createWorkshop" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Create Workshop
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/managerShopPanel/assignMechanics">
                Assign Mechanics
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Workshops Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workshops</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{workshops?.length || 0}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Workshops</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {workshops.filter(w => w.status === 'OPEN').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {workshops?.length > 0 
                ? (workshops.reduce((acc, w) => acc + w.rating, 0) / workshops.length).toFixed(1)
                : '0.0'
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Workshops List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-foreground">Your Workshops</h2>
          <Badge variant="secondary" className="text-sm">
            {workshops?.length || 0} workshop{(workshops?.length || 0) !== 1 ? 's' : ''}
          </Badge>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <p className="text-destructive text-center">{error}</p>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (workshops?.length || 0) === 0 && (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                No workshops found
              </h3>
              <p className="text-muted-foreground mb-4">
                You haven't created any workshops yet. Create your first workshop to get started.
              </p>
              <Button asChild>
                <Link to="/managerShopPanel/createWorkshop" className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Create Your First Workshop
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {!loading && !error && (workshops?.length || 0) > 0 && (
          <div className="grid gap-6">
            {workshops?.map((workshop) => (
              <Card key={workshop.id} className="border-muted/50 bg-card shadow-sm">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 lg:flex-row">
                    {/* Workshop Image */}
                    <div className="flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-border lg:w-64">
                      <img
                        src={workshop.image_url || "/placeholder.svg"}
                        alt={`${workshop.name} photo`}
                        className="h-48 w-full object-cover lg:h-40"
                        loading="lazy"
                      />
                    </div>

                    {/* Workshop Info */}
                    <div className="flex min-w-0 flex-1 flex-col gap-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">
                            {workshop.name}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
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
                          </div>
                        </div>
                      </div>

                      <p className="text-muted-foreground line-clamp-2">
                        {workshop.description}
                      </p>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="truncate">{workshop.address}</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-muted/20">
                        <div className="text-sm text-muted-foreground">
                          Created: {new Date(workshop.createdAt).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild size="sm" variant="outline">
                            <Link 
                              to={`/managerShopPanel/workshops/${workshop.id}`} 
                              className="flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteWorkshop(workshop.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerShopPanel;

