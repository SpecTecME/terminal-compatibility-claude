/**
 * FavoriteToggle Component (Star Button)
 * 
 * PURPOSE:
 * Reusable favorite/bookmark toggle button with visual state feedback.
 * Used on detail pages (TerminalDetail, VesselDetail) for user bookmarking.
 * 
 * TWO STATES (isFavorite boolean):
 * 
 * FAVORITED (isFavorite = true):
 * - Icon: Filled star (fill-amber-500)
 * - Color: Amber/gold (text-amber-500)
 * - Hover: Darker amber (hover:text-amber-600)
 * - Tooltip: "Remove from favorites"
 * 
 * NOT FAVORITED (isFavorite = false):
 * - Icon: Outline star (no fill)
 * - Color: Gray (text-gray-400)
 * - Hover: Darker gray (hover:text-gray-600)
 * - Tooltip: "Add to favorites"
 * 
 * RESPONSIVE SIZING (lines 12-22):
 * 
 * Three size variants for different contexts:
 * 
 * - sm: 7x7 button, 3x3 icon (compact lists)
 * - default: 8x8 button, 4x4 icon (standard detail pages)
 * - lg: 9x9 button, 5x5 icon (prominent placements)
 * 
 * Flexibility for various UI densities.
 * 
 * FILL TECHNIQUE (line 34):
 * fill-amber-500 class fills star shape when favorited.
 * Creates solid star vs outline star distinction.
 * Lucide icons support fill via CSS class.
 * 
 * TOOLTIP DELAY (line 25):
 * delayDuration: 200ms
 * Fast enough for quick feedback.
 * Not instant (prevents flicker on hover).
 * 
 * CONDITIONAL TOOLTIP TEXT (line 38):
 * Tooltip dynamically reflects current state + next action.
 * Clear call-to-action for user.
 * 
 * BACKEND INTEGRATION PATTERN:
 * This component is UI only.
 * Parent handles actual favorite toggle mutation.
 * 
 * TYPICAL PARENT IMPLEMENTATION:
 * const toggleFavoriteMutation = useMutation({
 *   mutationFn: () => base44.entities.UserFavoriteTerminal.toggle(terminalId),
 *   onSuccess: () => queryClient.invalidateQueries(['favorites'])
 * });
 * 
 * <FavoriteToggle 
 *   isFavorite={isFavorited} 
 *   onToggle={() => toggleFavoriteMutation.mutate()}
 * />
 * 
 * ACCESSIBILITY:
 * - Tooltip provides screen reader context
 * - Button inherits keyboard navigation
 * - Visual state change (not just color, but fill too)
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Star } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function FavoriteToggle({ isFavorite, onToggle, size = "default" }) {
  const sizeClasses = {
    sm: "h-7 w-7",
    default: "h-8 w-8",
    lg: "h-9 w-9"
  };

  const iconSizes = {
    sm: "w-3 h-3",
    default: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className={`${sizeClasses[size]} ${isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Star className={`${iconSizes[size]} ${isFavorite ? 'fill-amber-500' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? 'Remove from favorites' : 'Add to favorites'}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}