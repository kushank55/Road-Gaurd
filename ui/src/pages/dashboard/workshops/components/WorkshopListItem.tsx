import { MapPin, Star, User2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Button from "@/components/button";
import { Link } from "react-router-dom";

type Review = {
  author: string;
  rating: number;
  text: string;
};

type Shop = {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  owner: string;
  services: string[];
  locationLabel: string;
  lat: number;
  lng: number;
  review: Review;
  distance?: number;
};

export function WorkshopListItem({ shop }: { shop: Shop }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border border-muted/50 bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="flex-shrink-0">
        <img
          src={shop.imageUrl || "/placeholder.svg"}
          alt={`${shop.name} photo`}
          className="h-16 w-16 rounded-lg object-cover"
          loading="lazy"
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-lg font-semibold truncate">{shop.name}</h3>
              <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground flex-shrink-0">
                Open
              </span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
              {shop.description}
            </p>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{shop.locationLabel}</span>
                {shop.distance && (
                  <span className="text-blue-600 font-medium">
                    • {shop.distance.toFixed(1)}km away
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <User2 className="h-4 w-4" />
                <span>Owner: {shop.owner}</span>
              </div>
            </div>

            {/* Services - only show first few in list view */}
            {shop.services.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {shop.services.slice(0, 3).map((service) => (
                  <Badge
                    key={service}
                    variant="secondary"
                    className="text-xs"
                  >
                    {service}
                  </Badge>
                ))}
                {shop.services.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{shop.services.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Rating and Action */}
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">{shop.review.rating.toFixed(1)}</span>
              </div>
            </div>
            
            <Button className="bg-amber-500 text-black hover:bg-amber-400 text-sm px-3 py-1">
              <Link to={`/workshops/shop/${shop.id}`} aria-label={`View details for ${shop.name}`}>
                View Details
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
