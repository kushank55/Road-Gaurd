import { MapPin, User2 } from "lucide-react";
import { Stars } from "./stars";
import { Badge } from "@/components/ui/badge"; 
import { Card, CardContent } from "@/components/ui/card"; 
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

// --- Main ShopCard Component ---
export function ShopCard({ shop }: { shop: Shop }) {
  return (
    <Card className="border-muted/50 bg-card shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          {/* Left: Image */}
          <div className="flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-border md:w-56">
            {/* Replaced next/image with standard <img> tag */}
            <img
              src={shop.imageUrl || "/placeholder.svg"}
              alt={`${shop.name} photo`}
              className="h-40 w-full object-cover"
              loading="lazy" // Added native lazy loading for performance
            />
          </div>

          {/* Middle: Info */}
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-pretty text-lg font-semibold">{shop.name}</h2>
              <span className="rounded-full border px-2 py-1 text-xs text-muted-foreground">
                Open
              </span>
            </div>

            <p className="line-clamp-3 text-sm text-muted-foreground">
              {shop.description}
            </p>

            {/* Services tags */}
            <div className="flex flex-wrap gap-2">
              {shop.services.map((s) => (
                <Badge
                  key={s}
                  variant="secondary"
                  className="rounded-full bg-secondary/60 text-xs text-foreground"
                >
                  {s}
                </Badge>
              ))}
            </div>

            {/* Location */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="size-4" aria-hidden />
              <span className="truncate">{shop.locationLabel}</span>
              {shop.distance && (
                <span className="text-blue-600 font-medium">
                  • {shop.distance.toFixed(1)}km away
                </span>
              )}
            </div>

            {/* Review */}
            <div className="rounded-md border bg-muted/20 p-3">
              <div className="mb-1 flex items-center gap-2">
                <User2 className="size-4" aria-hidden />
                <span className="text-sm font-medium">
                  {shop.review.author}
                </span>
                <Stars rating={shop.review.rating} />
              </div>
              <p className="text-sm text-muted-foreground">
                {shop.review.text}
              </p>
            </div>

           <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Owner:</span> <span className="font-medium">{shop.owner}</span>
              </div>
              <Button className="bg-amber-500 text-black hover:bg-amber-400">
                <Link to={`/workshops/shop/${shop.id}`} aria-label={`View details for ${shop.name}`}>
                  View details
                </Link>
              </Button>
            </div>
        </div>
        </div>
      </CardContent>
    </Card>
  );
}

