/**
 * ArchivedToggle Component (Three-State Filter Button)
 * 
 * PURPOSE:
 * Provides a cycling toggle button for filtering archived vs active records.
 * Used on list pages (Terminals, Berths, etc.) to control visibility of archived items.
 * 
 * THREE STATES (lines 12-13):
 * 
 * 1. 'active' (Default):
 *    - Shows only active/non-archived records
 *    - Icon: outline archive (not filled)
 *    - Color: gray (neutral state)
 *    - Tooltip: "Show archived only"
 * 
 * 2. 'archived':
 *    - Shows ONLY archived records
 *    - Icon: filled archive
 *    - Color: amber (warning/caution color)
 *    - Tooltip: "Show all"
 * 
 * 3. 'all':
 *    - Shows both active AND archived
 *    - Icon: filled archive
 *    - Color: blue (informational)
 *    - Tooltip: "Show active only"
 * 
 * CYCLING BEHAVIOR:
 * Each click advances to next state:
 * active → archived → all → active → ...
 * 
 * Handled by parent component's onToggle callback.
 * Button is UI only, doesn't manage state internally.
 * 
 * VISUAL FEEDBACK (lines 21-25):
 * 
 * Dynamic styling based on current mode:
 * - Background color changes (bg-amber-50, bg-blue-50, default)
 * - Border color matches (border-amber-300, border-blue-300)
 * - Text color matches (text-amber-700, text-blue-700)
 * - Icon fill state (fill-current when archived/all)
 * 
 * Clear visual indicator of current filter state.
 * 
 * TOOLTIP INTELLIGENCE (lines 15-19):
 * Tooltip shows NEXT action, not current state.
 * - "Show archived only" when currently showing active
 * - "Show all" when currently showing archived
 * - "Show active only" when currently showing all
 * 
 * Guides user on what will happen on next click.
 * 
 * ICON FILL (line 37):
 * fill-current applied when mode !== 'active'.
 * Solid fill visually indicates "filter engaged".
 * Outline indicates default/neutral state.
 * 
 * USAGE CONTEXT:
 * Typically placed in list page headers next to search/filter controls.
 * Works with parent component filter logic.
 * 
 * EXAMPLE IMPLEMENTATION:
 * const [archivedFilter, setArchivedFilter] = useState('active');
 * const handleToggle = () => {
 *   if (archivedFilter === 'active') setArchivedFilter('archived');
 *   else if (archivedFilter === 'archived') setArchivedFilter('all');
 *   else setArchivedFilter('active');
 * };
 * <ArchivedToggle archivedFilter={archivedFilter} onToggle={handleToggle} />
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ArchivedToggle({ archivedFilter, onToggle }) {
  // archivedFilter: 'active' | 'archived' | 'all'
  const mode = archivedFilter || 'active';
  
  const getTooltip = () => {
    if (mode === 'active') return 'Show archived only';
    if (mode === 'archived') return 'Show all';
    return 'Show active only';
  };

  const getStyles = () => {
    if (mode === 'archived') return 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100';
    if (mode === 'all') return 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100';
    return 'border-gray-300 text-gray-600 hover:bg-gray-50';
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={onToggle}
            className={getStyles()}
          >
            <Archive className={`w-4 h-4 ${mode !== 'active' ? 'fill-current' : ''}`} />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltip()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}