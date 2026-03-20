/**
 * Tabs Component (Radix UI Wrapper)
 * 
 * PURPOSE:
 * Provides accessible tabbed navigation UI pattern using Radix UI primitives.
 * Used extensively across detail pages (VesselDetail, TerminalDetail, CompanyDetail)
 * for organizing large amounts of related information into logical sections.
 * 
 * COMPONENTS:
 * 
 * 1. Tabs (Root):
 *    - Container for entire tab system
 *    - Manages active tab state
 *    - Wraps TabsList and TabsContent components
 * 
 * 2. TabsList:
 *    - Horizontal bar containing tab triggers
 *    - Styled with muted background and rounded corners
 *    - Auto-highlights active tab
 * 
 * 3. TabsTrigger:
 *    - Individual tab button
 *    - Active state: white background + shadow
 *    - Inactive state: transparent background
 *    - Smooth transitions between states
 *    - Full keyboard navigation support
 * 
 * 4. TabsContent:
 *    - Content panel for each tab
 *    - Only active tab's content rendered/visible
 *    - Focus management for accessibility
 * 
 * ACCESSIBILITY FEATURES:
 * - ARIA roles and attributes (via Radix)
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Focus rings (focus-visible:ring-2)
 * - Screen reader announcements
 * 
 * TYPICAL USAGE PATTERN:
 * <Tabs defaultValue="details">
 *   <TabsList>
 *     <TabsTrigger value="details">Details</TabsTrigger>
 *     <TabsTrigger value="documents">Documents</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="details">Detail content...</TabsContent>
 *   <TabsContent value="documents">Document content...</TabsContent>
 * </Tabs>
 */
import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props} />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow",
      className
    )}
    {...props} />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props} />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }