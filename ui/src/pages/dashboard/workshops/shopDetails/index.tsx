import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, User2, Star, Send } from 'lucide-react';
import { useWorkshopDetails } from '@/hooks/useWorkshopDetails';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import ShopMap from '../components/shopMap';
import { Stars } from '../components/stars';
import { workshopService } from '@/services/workshop.service';

export default function ShopDetailsPage() {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { workshop, loading, error, refetch } = useWorkshopDetails(shopId || '');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  // Redirect if no shop ID is provided
  React.useEffect(() => {
    if (!shopId || shopId.trim() === '') {
      navigate('/workshops');
      return;
    }
    
    // Validate shop ID format (basic validation)
    if (!/^[a-zA-Z0-9-_]+$/.test(shopId)) {
      console.warn('Invalid workshop ID format:', shopId);
    }
  }, [shopId, navigate]);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-lg">Loading workshop details...</div>
          <div className="text-sm text-muted-foreground">Please wait while we fetch the workshop information</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </main>
    );
  }

  if (error || !workshop) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="text-lg text-red-600">
            {error || 'Workshop not found'}
          </div>
          <div className="text-sm text-muted-foreground">
            The workshop you're looking for might not exist or has been removed.
          </div>
          <div className="flex gap-3">
            <Button onClick={() => refetch()} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Retry
            </Button>
            <Button onClick={() => navigate('/workshops')} variant="outline">
              Back to Workshops
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const handleSubmitReview = async () => {
    if (!reviewText.trim()) {
      return; // Don't submit empty reviews
    }
    
    // Validate review length (backend requires 5-1000 characters)
    if (reviewText.trim().length < 5) {
      setReviewError('Review must be at least 5 characters long');
      return;
    }
    
    if (reviewText.trim().length > 1000) {
      setReviewError('Review must be less than 1000 characters');
      return;
    }
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      setReviewError('Please log in to submit a review');
      return;
    }
    
    setSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(false);
    
    try {
      // Submit review using workshop service
      if (!shopId) {
        setReviewError('Workshop ID is missing');
        return;
      }

      await workshopService.addWorkshopReview(shopId, {
        rating: reviewRating,
        comment: reviewText
      });

      setReviewText('');
      setReviewSuccess(true);
      // Refresh workshop data to show new review
      await refetch();
      
      // Clear success message after 3 seconds
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (error: any) {
      if (error.response?.status === 401) {
        setReviewError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setReviewError('Access denied. You may not have permission to submit reviews.');
      } else if (error.response?.status === 409) {
        setReviewError('You have already reviewed this workshop.');
      } else {
        setReviewError(error.response?.data?.message || error.message || 'Failed to submit review');
      }
      console.error('Failed to submit review:', error);
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/workshops')}
            className="p-2"
            aria-label="Back to workshops"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{workshop.name || 'Workshop'}</h1>
            {workshop.status && (
              <Badge 
                variant={workshop.status === 'OPEN' ? 'default' : 'secondary'}
                className={workshop.status === 'OPEN' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
              >
                {workshop.status}
              </Badge>
            )}
          </div>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Section - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workshop Image */}
          {workshop.image_url && (
            <Card>
              <CardContent className="p-0">
                <img
                  src={workshop.image_url}
                  alt={`${workshop.name || 'Workshop'} photo`}
                  className="w-full h-64 object-cover rounded-t-lg"
                  loading="lazy"
                />
              </CardContent>
            </Card>
          )}
          
          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Services</h2>
              <div className="space-y-3">
                <p className="text-muted-foreground leading-relaxed">
                  {workshop.description || 'No description available for this workshop.'}
                </p>
                {workshop.createdAt && (
                  <div className="text-xs text-muted-foreground">
                    Established: {new Date(workshop.createdAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Reviews */}
          <Card>
            <CardContent className="p-6">
                             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-xl font-semibold">Customer Reviews</h2>
                 <div className="flex items-center gap-2">
                   {workshop.reviews && Array.isArray(workshop.reviews) && (
                     <span className="text-sm text-muted-foreground">
                       {workshop.reviews.length} review{workshop.reviews.length !== 1 ? 's' : ''}
                     </span>
                   )}
                   {!isAuthenticated && (
                     <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
                       Login required to review
                     </span>
                   )}
                 </div>
               </div>
              
              {/* Average Rating */}
              <div className="flex items-center gap-2 mb-4">
                <Stars rating={Math.min(5, Math.max(0, workshop.averageRating || workshop.rating || 0))} />
                <span className="text-sm text-muted-foreground">
                  {Math.min(5, Math.max(0, workshop.averageRating || workshop.rating || 0)).toFixed(1)} out of 5
                </span>
              </div>

                             {/* Review Input */}
               <div className="space-y-3 mb-6">
                 {/* Success/Error Messages */}
                 {reviewSuccess && (
                   <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
                     <p className="text-sm text-green-800">Review submitted successfully!</p>
                   </div>
                 )}
                 {reviewError && (
                   <div className="p-3 bg-red-100 border border-red-300 rounded-lg flex items-center justify-between">
                     <p className="text-sm text-red-800">{reviewError}</p>
                     <button
                       onClick={() => setReviewError(null)}
                       className="text-red-600 hover:text-red-800 text-sm font-medium"
                     >
                       ×
                     </button>
                   </div>
                 )}
                 
                 {isAuthenticated ? (
                   <>
                     <div className="flex items-center gap-2">
                       <span className="text-sm font-medium">Rating:</span>
                       <div className="flex gap-1">
                         {[1, 2, 3, 4, 5].map((star) => (
                           <button
                             key={star}
                             onClick={() => {
                               setReviewRating(star);
                               // Clear error when user changes rating
                               if (reviewError) {
                                 setReviewError(null);
                               }
                             }}
                             className={`p-1 ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'}`}
                           >
                             <Star className="h-4 w-4 fill-current" />
                           </button>
                         ))}
                       </div>
                     </div>
                     <div className="space-y-2">
                       <Textarea
                         placeholder="Write a message..."
                         value={reviewText}
                         onChange={(e) => {
                           setReviewText(e.target.value);
                           // Clear error when user starts typing
                           if (reviewError) {
                             setReviewError(null);
                           }
                         }}
                         className="min-h-[80px]"
                       />
                       <div className="flex justify-between text-xs text-muted-foreground">
                         <span>Minimum 5 characters</span>
                         <span className={reviewText.length > 1000 ? 'text-red-500' : ''}>
                           {reviewText.length}/1000
                         </span>
                       </div>
                     </div>
                     <Button 
                       onClick={handleSubmitReview} 
                       disabled={submittingReview || !reviewText.trim() || reviewText.trim().length < 5 || reviewText.trim().length > 1000}
                       className="w-full"
                     >
                       <Send className="h-4 w-4 mr-2" />
                       {submittingReview ? 'Sending...' : 'Send'}
                     </Button>
                     <p className="text-xs text-muted-foreground text-center">
                       Share your experience with this workshop
                     </p>
                   </>
                 ) : (
                   <div className="text-center py-6">
                     <p className="text-muted-foreground mb-3">Please log in to submit a review</p>
                     <Button onClick={() => navigate('/login')} variant="outline">
                       Log In to Review
                     </Button>
                     <p className="text-xs text-muted-foreground mt-2">
                       Your review helps other customers make informed decisions
                     </p>
                   </div>
                 )}
               </div>

                             {/* Existing Reviews */}
               <div className="space-y-4">
                 {loading ? (
                   // Loading skeleton for reviews
                   Array.from({ length: 2 }).map((_, index) => (
                     <div key={index} className="border rounded-lg p-4 bg-muted/20 animate-pulse">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <div className="h-4 bg-muted-foreground/20 rounded w-24"></div>
                           <div className="h-3 bg-muted-foreground/20 rounded w-16"></div>
                         </div>
                         <div className="h-4 bg-muted-foreground/20 rounded w-20"></div>
                       </div>
                       <div className="h-3 bg-muted-foreground/20 rounded w-full"></div>
                     </div>
                   ))
                 ) : workshop.reviews && Array.isArray(workshop.reviews) && workshop.reviews.length > 0 ? (
                   workshop.reviews.map((review) => (
                     <div key={review.id || Math.random()} className="border rounded-lg p-4 bg-muted/20">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <span className="font-medium">{review.user?.name || 'Anonymous'}</span>
                           {review.createdAt && (
                             <span className="text-xs text-muted-foreground">
                               {new Date(review.createdAt).toLocaleDateString()}
                             </span>
                           )}
                         </div>
                         <Stars rating={review.rating || 0} />
                       </div>
                       <p className="text-sm text-muted-foreground">{review.comment || 'No comment provided'}</p>
                     </div>
                   ))
                 ) : (
                   <div className="border rounded-lg p-4 bg-muted/20">
                     No reviews.
                   </div>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Section - Sidebar */}
        <div className="space-y-6">
          {/* Book Service Button */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-3"
                  onClick={() => {
                    if (isAuthenticated && user) {
                      navigate(`/workshops/shop/${shopId}/${user.id}`);
                    } else {
                      navigate('/login');
                    }
                  }}
                >
                  Book Service
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {isAuthenticated ? 
                    'Schedule a service appointment' : 
                    'Please log in to book a service'
                  }
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="h-5 w-5 text-pink-500" />
                <h3 className="font-semibold">Location</h3>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-sm text-muted-foreground">
                  {workshop.address || 'Address not available'}
                </p>
                {workshop.latitude && workshop.longitude && 
                 !isNaN(workshop.latitude) && !isNaN(workshop.longitude) && (
                  <p className="text-xs text-muted-foreground">
                    Coordinates: {workshop.latitude.toFixed(6)}, {workshop.longitude.toFixed(6)}
                  </p>
                )}
              </div>
              {workshop.latitude && workshop.longitude && 
               !isNaN(workshop.latitude) && !isNaN(workshop.longitude) ? (
                <ShopMap
                  lat={workshop.latitude}
                  lng={workshop.longitude}
                  heightClass="h-48"
                />
              ) : (
                <div className="h-48 bg-muted/20 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Location not available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Owner Information */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Owner</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <User2 className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{workshop.owner?.name || 'Unknown Owner'}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  {workshop.owner?.phone || 'Phone not available'}
                </div>
                <div className="text-sm text-muted-foreground">
                  {workshop.owner?.email || 'Email not available'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
