/**
 * Popover Component (Radix UI Wrapper)
 * 
 * PURPOSE:
 * Floating content panel anchored to trigger element, used for date pickers,
 * dropdown menus, and contextual information displays.
 * 
 * COMPONENTS:
 * 
 * 1. Popover (Root):
 *    - Controls open/closed state
 *    - Manages focus trap
 *    - Handles outside clicks to close
 * 
 * 2. PopoverTrigger:
 *    - Button/element that opens popover
 *    - Often wraps buttons or interactive elements
 * 
 * 3. PopoverAnchor:
 *    - Optional positioning reference
 *    - Use when trigger and anchor are different elements
 * 
 * 4. PopoverContent:
 *    - Floating panel with content
 *    - Auto-positions to avoid viewport edges
 *    - Props:
 *      - align: "start" | "center" | "end" (default: center)
 *      - sideOffset: Distance from trigger in pixels (default: 4)
 * 
 * POSITIONING:
 * - Portal rendered to avoid z-index stacking issues
 * - Smart collision detection (stays in viewport)
 * - Animated entry/exit (fade + zoom + slide)
 * 
 * STYLING:
 * - w-72 default width (288px)
 * - Rounded corners, shadow, border
 * - Inherits theme colors (bg-popover, text-popover-foreground)
 * 
 * COMMON USE CASES:
 * - Date picker dialogs (DatePicker component)
 * - Dropdown menus with rich content
 * - Color pickers
 * - Contextual help tooltips
 * - Filter panels
 * 
 * vs DROPDOWN MENU:
 * - Popover: General-purpose floating content
 * - DropdownMenu: Specific to menu/action lists
 */
import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverContent = React.forwardRef(({ className, align = "center", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      {...props} />
  </PopoverPrimitive.Portal>
))
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }