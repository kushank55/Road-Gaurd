import { cn } from "@/lib/utils"; // Assuming relative path
import { Star } from "lucide-react";


export function Stars({ rating }: { rating: number }) {
  // Render 5 stars with half step support
  const stars = Array.from({ length: 5 }, (_, i) => i + 1);
  return (
    <div
      className="flex items-center gap-0.5"
      aria-label={`Rating ${rating} out of 5`}
    >
      {stars.map((i) => {
        const filled = i <= Math.floor(rating);
        const half = !filled && i - rating <= 0.5; // Simplified logic for half star
        return (
          <span key={i} className="relative inline-flex">
            <Star
              className={cn(
                "size-4",
                filled ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
              )}
            />
            {half && (
              <Star
                className="absolute left-0 top-0 size-4 overflow-hidden text-yellow-500"
                style={{ clipPath: "inset(0 50% 0 0)" }}
              />
            )}
          </span>
        );
      })}
      <span className="ml-1 text-xs text-muted-foreground">
        {rating.toFixed(1)}
      </span>
    </div>
  );
}