/**
 * ============================================================
 * LAYOUT.JS - APPLICATION SHELL & NAVIGATION ARCHITECTURE
 * ============================================================
 * 
 * PURPOSE:
 * The central UI orchestrator providing navigation, authentication context,
 * and consistent application chrome for all pages. This is THE most important
 * file in the application's frontend architecture.
 * 
 * SCOPE:
 * - Wraps EVERY page except Home (landing page)
 * - Provides global navigation hierarchy
 * - Manages React Query configuration
 * - Handles mobile/desktop responsive behavior
 * - Controls user authentication UI
 * 
 * ============================================================
 * PART 1: REACT QUERY GLOBAL CONFIGURATION (lines 47-70)
 * ============================================================
 * 
 * SINGLETON PATTERN FOR HOT MODULE RELOAD:
 * QueryClient stored in globalThis to survive Vite HMR.
 * 
 * WITHOUT THIS:
 * Every code save creates new QueryClient → cache lost → UI flickers.
 * 
 * WITH THIS:
 * QueryClient persists across hot reloads → smooth development.
 * 
 * QUERY DEFAULTS (applied to ALL queries unless overridden):
 * 
 * staleTime: 15 minutes (900,000 ms)
 * - How long data considered "fresh"
 * - No background refetch during this window
 * - CHOSEN BECAUSE: Maritime data relatively static (terminals don't relocate hourly)
 * - TRADE-OFF: Better performance vs potential stale data
 * 
 * gcTime: 60 minutes (3,600,000 ms)
 * - Garbage collection time for unused cache
 * - Data stays in memory even after component unmount
 * - BENEFIT: Instant display when user navigates back
 * - EXAMPLE: User views VesselDetail → navigates to Documents → back to VesselDetail
 *   Result: Instant render from cache (no loading spinner)
 * 
 * refetchOnWindowFocus: false
 * - Don't refetch when user returns to browser tab
 * - RATIONALE: Reduces unnecessary API load, data doesn't change that fast
 * - ALTERNATIVE: true would keep ultra-fresh but use more bandwidth
 * 
 * refetchOnMount: false  
 * - Don't refetch when component remounts
 * - Relies on staleTime instead
 * - BENEFIT: Faster page loads
 * 
 * retry: false
 * - Don't retry failed queries
 * - RATIONALE: Fail fast, show error immediately
 * - ALTERNATIVE: retry: 1 would mask transient network issues
 * 
 * WHY THESE SETTINGS:
 * Application optimized for PERFORMANCE over real-time accuracy.
 * Users can manually refresh (browser reload) if needed.
 * Master data (countries, document types) changes rarely.
 * Operational data (vessel statuses) acceptable with 15min lag.
 * 
 * ============================================================
 * PART 2: USER AUTHENTICATION CACHING (lines 89-101)
 * ============================================================
 * 
 * CRITICAL OPTIMIZATION:
 * User data fetched ONCE per session at Layout level.
 * 
 * QUERY KEY: ['currentUser']
 * - Used throughout app for user context
 * - Pages can access via useQuery(['currentUser']) without refetching
 * - Shared cache across all components
 * 
 * CACHE SETTINGS:
 * - staleTime: 15 minutes (same as global default)
 * - gcTime: 60 minutes (keeps user logged in feel)
 * - refetchOnWindowFocus: false (don't re-auth on tab switch)
 * - retry: false (auth either works or doesn't)
 * 
 * getCurrentUserCached() FUNCTION:
 * Imported from components/utils/currentUser.
 * Adds memory caching BEFORE React Query.
 * Double-layer cache for maximum performance.
 * 
 * CACHE INVALIDATION:
 * Cleared on:
 * - Logout (line 417, 522)
 * - Profile update (in Profile.jsx)
 * 
 * ============================================================
 * PART 3: NAVIGATION HIERARCHY (lines 103-131)
 * ============================================================
 * 
 * FOUR-TIER NAVIGATION STRUCTURE:
 * 
 * TIER 1 - PRIMARY NAVIGATION (lines 103-112):
 * Always visible, core operational functions:
 * 
 * - Home: Landing page (public)
 * - Dashboard: Overview/analytics (authenticated)
 * - World Map: Geographic terminal visualization
 * - Terminal Complexes: Port/facility groups
 * - Terminals: Individual terminal facilities  
 * - Berths: Docking positions
 * - Fleet: Vessel registry
 * - Documents: Document library
 * 
 * DESIGN DECISION:
 * Flat structure for speed.
 * No sub-menus in primary nav.
 * Users access most-used pages with single click.
 * 
 * TIER 2 - CRM SECTION (lines 114-117):
 * Collapsible accordion, relationship management:
 * 
 * - Companies: Organization directory
 * - Contacts: People and group emails
 * 
 * WHY COLLAPSIBLE:
 * CRM is support function, not primary workflow.
 * Reduces navigation clutter.
 * Users focusing on vessels/terminals can hide.
 * 
 * STATE: crmExpanded (lines 85, 177)
 * 
 * TIER 3 - CONFIGURATION (lines 119-125):
 * Admin-only, collapsible, five sub-sections:
 * 
 * - Reference Data: Countries, Document Types, Categories, Authorities
 * - Vessel Configuration: Vessel Types, Cargo/Fuel types, Policies
 * - System & Behavior: UDFs, Tags, Security, Aliases
 * - Application Settings: App-level preferences
 * - Design Elements: UI component showcase (development tool)
 * 
 * WHY FIVE SUB-SECTIONS:
 * Configuration is vast (40+ pages).
 * Grouping by domain reduces cognitive load.
 * Users find settings faster with categorization.
 * 
 * STATE: configurationExpanded (lines 86, 208)
 * 
 * TIER 4 - ADMINISTRATION (lines 127-131):
 * Admin-only, collapsible, user/audit management:
 * 
 * - Users: User accounts, invitations
 * - Roles: Permission management
 * - Audit Log: Change tracking
 * 
 * ADMIN GATE (line 205, 283):
 * if (user?.role === 'admin')
 * Only renders for admin users.
 * Regular users never see these sections.
 * 
 * STATE: administrationExpanded (lines 87, 235)
 * 
 * ============================================================
 * PART 4: COLLAPSIBLE SIDEBAR BEHAVIOR (lines 83-84, 327-337)
 * ============================================================
 * 
 * DESKTOP COLLAPSE FEATURE:
 * Sidebar can collapse to icon-only mode.
 * 
 * COLLAPSED STATE (collapsed = true):
 * - Sidebar width: 64px (w-16)
 * - Icons only, no text labels
 * - No sub-menu accordions (all icons shown flat)
 * - Content area shifts left (more screen space)
 * 
 * EXPANDED STATE (collapsed = false):
 * - Sidebar width: 256px (w-64)
 * - Icons + text labels
 * - Accordion sub-menus functional
 * - Standard desktop layout
 * 
 * TOGGLE BUTTON (lines 327-337):
 * - Desktop only (hidden md:block)
 * - Bottom of sidebar
 * - Chevron icon indicates direction
 * - Smooth width transition (transition-all duration-300)
 * 
 * COLLAPSED MODE ICON NAVIGATION (lines 263-323):
 * When collapsed, shows ALL nav items as icons (no accordions).
 * Includes CRM, Config, Admin items.
 * No expand/collapse logic (defeats purpose of collapsed mode).
 * 
 * USE CASE:
 * Users with large monitors can collapse sidebar for more content space.
 * Still have quick icon access to all pages.
 * 
 * ============================================================
 * PART 5: MOBILE NAVIGATION (lines 361-451)
 * ============================================================
 * 
 * MOBILE HEADER (lines 362-426):
 * Sticky top bar visible on mobile only (md:hidden).
 * 
 * CONTAINS:
 * 1. Hamburger menu button (opens sidebar overlay)
 * 2. App logo + title
 * 3. User dropdown (avatar with profile/logout)
 * 
 * HAMBURGER CLICK:
 * Sets mobileOpen = true → triggers overlay sidebar.
 * 
 * MOBILE SIDEBAR OVERLAY (lines 428-451):
 * Full-screen modal navigation.
 * 
 * STRUCTURE:
 * - Backdrop: bg-black/60 (dim rest of screen)
 * - Sidebar: w-64 (same width as desktop expanded)
 * - Close button: top-right X icon
 * - Content: Same NavContent component as desktop
 * 
 * INTERACTION:
 * - Click backdrop → closes sidebar
 * - Click sidebar → e.stopPropagation() prevents close
 * - Click nav link → setMobileOpen(false) auto-closes
 * 
 * WHY OVERLAY INSTEAD OF PUSH:
 * Mobile screens too narrow for side-by-side.
 * Overlay maximizes content space when nav closed.
 * Standard mobile pattern (drawer navigation).
 * 
 * ============================================================
 * PART 6: RESPONSIVE LAYOUT MECHANICS (lines 453-541)
 * ============================================================
 * 
 * DESKTOP SIDEBAR (lines 453-458):
 * - Fixed positioning (stays put on scroll)
 * - Full height (h-screen)
 * - Hidden on mobile (hidden md:block)
 * - Dynamic width based on collapsed state
 * - High z-index (z-40) to stay above content
 * 
 * CONTENT AREA MARGIN (lines 462-465):
 * Adapts to sidebar width:
 * - Mobile: pt-16 (top padding for mobile header)
 * - Desktop expanded: md:ml-64 (256px left margin)
 * - Desktop collapsed: md:ml-16 (64px left margin)
 * 
 * SMOOTH TRANSITIONS:
 * transition-all duration-300 on both sidebar and content.
 * Sidebar width and content margin change simultaneously.
 * Creates polished slide animation.
 * 
 * DESKTOP TOP BAR (lines 466-532):
 * - Sticky header (sticky top-0)
 * - White background with border
 * - Breadcrumbs on left
 * - Notifications + user menu on right
 * - Hidden on mobile (hidden md:flex)
 * 
 * ============================================================
 * PART 7: ACTIVE LINK HIGHLIGHTING (lines 154, 184, 215, 242, etc.)
 * ============================================================
 * 
 * DETECTION LOGIC:
 * const isActive = currentPageName === item.href
 * 
 * currentPageName passed from router to Layout.
 * Compared against each nav item's href.
 * 
 * ACTIVE STYLING:
 * - Background: bg-gradient-to-r from-teal-500 to-cyan-600
 * - Text: text-white
 * - Shadow: shadow-lg (elevated appearance)
 * 
 * INACTIVE STYLING:
 * - Text: text-teal-100
 * - Hover: hover:text-white hover:bg-teal-800/50
 * 
 * VISUAL FEEDBACK:
 * User always knows current page location.
 * Gradient highlight draws eye.
 * Consistent pattern across all nav sections.
 * 
 * ============================================================
 * PART 8: HOME PAGE EXCEPTION (lines 341-344)
 * ============================================================
 * 
 * CRITICAL CONDITIONAL RENDER:
 * 
 * if (currentPageName === 'Home') {
 *   return children;
 * }
 * 
 * Home page renders WITHOUT layout wrapper.
 * 
 * RATIONALE:
 * - Home is public landing/marketing page
 * - Needs full creative control
 * - No navigation sidebar
 * - Custom header/footer
 * - Full-width design freedom
 * 
 * ALL OTHER PAGES:
 * Render inside full layout structure.
 * Consistent navigation experience.
 * 
 * ============================================================
 * PART 9: ACCORDION MENU STATE MANAGEMENT (lines 85-87, 177-202, 207-260)
 * ============================================================
 * 
 * THREE COLLAPSIBLE SECTIONS:
 * 
 * 1. CRM (lines 176-202):
 *    - Header button with chevron (lines 176-182)
 *    - Chevron rotates 180deg when open (rotate-180)
 *    - Links conditionally rendered (lines 183-202)
 *    - State: crmExpanded
 * 
 * 2. CONFIGURATION (lines 207-232):
 *    - Admin-only (user?.role === 'admin')
 *    - Header button + chevron
 *    - Sub-menu links
 *    - State: configurationExpanded
 * 
 * 3. ADMINISTRATION (lines 234-260):
 *    - Admin-only
 *    - Header button + chevron
 *    - Admin-specific pages
 *    - State: administrationExpanded
 * 
 * INTERACTION PATTERN:
 * onClick={() => setState(!state)}
 * Toggle open/closed.
 * Chevron CSS handles rotation animation.
 * Links visibility controlled by boolean check.
 * 
 * NO LOCALSTORAGE PERSISTENCE:
 * Unlike earlier version, this Layout doesn't persist accordion state.
 * Resets to defaults on page load.
 * Simpler implementation, acceptable UX.
 * 
 * ============================================================
 * PART 10: USER DROPDOWN MENUS (lines 377-425 mobile, 476-530 desktop)
 * ============================================================
 * 
 * TWO INSTANCES (Mobile + Desktop):
 * Same functionality, different styling.
 * 
 * MOBILE DROPDOWN (lines 377-425):
 * - Dark theme (bg-slate-800, border-slate-700)
 * - Compact for smaller screens
 * - Avatar in mobile header
 * 
 * DESKTOP DROPDOWN (lines 476-530):
 * - Light theme (bg-white, border-gray-200)
 * - Shows user name + email header (lines 488-491)
 * - Larger, more detailed
 * 
 * MENU ITEMS (Same in both):
 * 
 * 1. Profile Settings (link to Profile page):
 *    - Edit name, email, personal info
 *    - User icon
 * 
 * 2. Preferences (link to Preferences page):
 *    - Application preferences
 *    - Settings icon
 * 
 * 3. Security (link to UserSecurity page):
 *    - Password, 2FA, sessions
 *    - Shield icon
 * 
 * 4. My Tags (link to MyTags page):
 *    - Personal tag management
 *    - Tag icon
 * 
 * 5. Sign Out / Logout (action, not link):
 *    - clearCurrentUserCache() - clear memory cache
 *    - queryClient.removeQueries(['currentUser']) - clear React Query cache
 *    - base44.auth.logout() - platform logout + redirect
 *    - Red color (destructive action)
 *    - LogOut icon
 * 
 * CACHE CLEARING ON LOGOUT:
 * Essential to prevent stale user data after logout.
 * Next login gets fresh user object.
 * No data leakage between users.
 * 
 * ============================================================
 * PART 11: NOTIFICATION BELL (lines 472-475)
 * ============================================================
 * 
 * PLACEHOLDER IMPLEMENTATION:
 * Bell icon with red dot indicator.
 * Currently non-functional (no click handler).
 * 
 * RED DOT:
 * - Absolute positioned (top-1 right-1)
 * - w-2 h-2 rounded-full
 * - bg-teal-500
 * - Simulates unread notifications
 * 
 * TODO:
 * - Implement notification system
 * - Click to show notification panel
 * - Badge count for unread
 * - Real-time updates
 * 
 * ============================================================
 * PART 12: BREADCRUMBS INTEGRATION (line 469)
 * ============================================================
 * 
 * <Breadcrumbs currentPageName={currentPageName} />
 * 
 * Renders navigation trail in desktop header.
 * Component defined in components/ui/Breadcrumbs.jsx.
 * 
 * EXAMPLE BREADCRUMB:
 * Fleet > Vessel Detail > Al Khaleej
 * 
 * BENEFIT:
 * - Shows user's location in hierarchy
 * - Enables quick navigation up levels
 * - Professional application feel
 * 
 * DESKTOP ONLY:
 * Breadcrumbs in top bar (hidden on mobile).
 * Mobile uses back buttons instead.
 * 
 * ============================================================
 * PART 13: CSS CUSTOM PROPERTIES (lines 348-359)
 * ============================================================
 * 
 * GLOBAL THEME VARIABLES:
 * 
 * --color-primary: #088395 (Teal)
 * - Main brand color
 * - Used in buttons, highlights
 * 
 * --color-primary-dark: #0A4D68 (Dark Teal)  
 * - Sidebar background
 * - Header backgrounds
 * - Dark theme elements
 * 
 * --color-teal: #0FA4AF (Light Teal)
 * - Accents, hover states
 * - Secondary brand color
 * 
 * --font-sans: 'Inter', system-ui, -apple-system
 * - Primary typeface
 * - Professional, readable
 * - System font fallbacks
 * 
 * APPLIED TO:
 * - body background: #f8fafc (light gray)
 * - font-family via CSS variable
 * 
 * WHY IN LAYOUT:
 * Single source of truth.
 * All pages inherit theme.
 * Easy global redesign (change here, updates everywhere).
 * 
 * ============================================================
 * PART 14: NAVLINK AUTO-CLOSE ON MOBILE (line 159, 189, 220, 247, etc.)
 * ============================================================
 * 
 * onClick={() => setMobileOpen(false)}
 * 
 * Every nav link includes this handler.
 * 
 * BEHAVIOR:
 * User clicks link in mobile sidebar → sidebar closes immediately.
 * 
 * WHY:
 * - Better UX (don't leave drawer open)
 * - Maximizes content space for next page
 * - Standard mobile pattern
 * 
 * DESKTOP:
 * No effect (mobileOpen always false on desktop).
 * 
 * ============================================================
 * KEY ARCHITECTURAL DECISIONS SUMMARY:
 * ============================================================
 * 
 * 1. SINGLETON QUERY CLIENT:
 *    - Survives hot reloads
 *    - Persistent cache
 *    - Better DX
 * 
 * 2. AGGRESSIVE CACHING:
 *    - 15min stale time
 *    - No auto-refetch
 *    - Performance over freshness
 * 
 * 3. USER CONTEXT ONCE:
 *    - Single auth check
 *    - Shared across app
 *    - Cleared on logout
 * 
 * 4. HIERARCHICAL NAVIGATION:
 *    - 4 tiers (Primary, CRM, Config, Admin)
 *    - Collapsible sections
 *    - Icon-only collapse mode
 * 
 * 5. RESPONSIVE STRATEGY:
 *    - Mobile: Overlay drawer
 *    - Desktop: Fixed sidebar
 *    - Smooth transitions
 * 
 * 6. HOME PAGE BYPASS:
 *    - No layout wrapper
 *    - Full design freedom
 *    - Public landing page
 * 
 * 7. ADMIN GATING:
 *    - Config/Admin sections role-checked
 *    - Clean separation of concerns
 *    - Security through UI hiding (backend must enforce too)
 */
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { 
  Map, 
  Ship, 
  FileText, 
  Building2, 
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  LogOut,
  User,
  Bell,
  Settings,
  Menu,
  X,
  Anchor,
  Database,
  Shield,
  GitBranch,
  AlertCircle,
  Upload,
  Lock,
  Trash2,
  Users,
  Briefcase,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { getCurrentUserCached, clearCurrentUserCache } from '@/components/utils/currentUser';
import Breadcrumbs from '@/components/ui/Breadcrumbs';
import { ChatbotProvider } from '@/components/chatbot/ChatbotProvider';
import ChatbotWidget from '@/components/chatbot/ChatbotWidget';

console.log("Layout module loaded", Date.now());

// Create QueryClient as globalThis singleton - survives module reloads
const getQueryClient = () => {
  const g = globalThis;
  const existed = Boolean(g.__STME_QUERY_CLIENT__);

  if (!existed) {
    g.__STME_QUERY_CLIENT__ = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 15 * 60 * 1000,
          gcTime: 60 * 60 * 1000,
          refetchOnWindowFocus: false,
          refetchOnMount: false,
          retry: false,
        },
      },
    });
  }

  console.log("QueryClient existed already?", existed, Date.now());
  return g.__STME_QUERY_CLIENT__;
};

const queryClient = getQueryClient();

export default function Layout({ children, currentPageName }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ChatbotProvider>
        <LayoutContent children={children} currentPageName={currentPageName} />
      </ChatbotProvider>
    </QueryClientProvider>
  );
}

function LayoutContent({ children, currentPageName }) {
  console.log("Layout render", Date.now());
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [crmExpanded, setCrmExpanded] = useState(true);
  const [configurationExpanded, setConfigurationExpanded] = useState(false);
  const [administrationExpanded, setAdministrationExpanded] = useState(false);

  // Fetch user once and cache for 15 minutes
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      console.log("currentUser query fired", Date.now());
      return getCurrentUserCached();
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    retry: false
  });

  const navigation = [
    { name: 'Home', href: 'Home', icon: LayoutDashboard },
    { name: 'Dashboard', href: 'Dashboard', icon: LayoutDashboard },
    { name: 'World Map', href: 'TerminalMap', icon: Map },
    { name: 'Terminal Complexes', href: 'TerminalComplexes', icon: Building2 },
    { name: 'Terminals', href: 'Terminals', icon: Building2 },
    { name: 'Berths', href: 'Berths', icon: Anchor },
    { name: 'Fleet', href: 'Vessels', icon: Ship },
    { name: 'Documents', href: 'Documents', icon: FileText },
  ];

  const crmNavigation = [
    { name: 'Companies', href: 'Companies', icon: Building2 },
    { name: 'Contacts', href: 'Contacts', icon: User },
  ];

  const configurationNavigation = [
    { name: 'Reference Data', href: 'ConfigurationMasterData', icon: Database },
    { name: 'Vessel Configuration', href: 'ConfigurationVesselConfig', icon: Ship },
    { name: 'System & Behavior Configuration', href: 'ConfigurationSystemConfig', icon: Settings },
    { name: 'Application Settings', href: 'ConfigurationAppSettings', icon: Settings },
    { name: 'Vessel Terminal Document Sets', href: 'VesselTerminalDocumentSets', icon: FileText },
    { name: 'Design Elements', href: 'DesignElements', icon: Database },
  ];

  const adminNavigation = [
    { name: 'Users', href: 'AdminUsers', icon: Users },
    { name: 'Roles', href: 'Roles', icon: Shield },
    { name: 'Audit Log', href: 'AuditLog', icon: FileText },
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-teal-900/30",
        collapsed ? "justify-center" : "gap-3"
      )}>
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-white tracking-tight">Terminal</span>
            <span className="text-[10px] text-teal-300 uppercase tracking-widest">Compatibility</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = currentPageName === item.href;
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.href)}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                  : "text-teal-100 hover:text-white hover:bg-teal-800/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </Link>
          );
        })}

        {!collapsed && (
          <>
            <button
              onClick={() => setCrmExpanded(!crmExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 mt-4 hover:bg-teal-800/30 rounded-lg transition-colors"
            >
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">CRM</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-teal-400 transition-transform", crmExpanded && "rotate-180")} />
            </button>
            {crmExpanded && crmNavigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                      : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </>
        )}

        {user?.role === 'admin' && !collapsed && (
          <>
            <button
              onClick={() => setConfigurationExpanded(!configurationExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 mt-4 hover:bg-teal-800/30 rounded-lg transition-colors"
            >
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Configuration</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-teal-400 transition-transform", configurationExpanded && "rotate-180")} />
            </button>
            {configurationExpanded && configurationNavigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                      : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}

            <button
              onClick={() => setAdministrationExpanded(!administrationExpanded)}
              className="w-full flex items-center justify-between px-3 py-2 mt-4 hover:bg-teal-800/30 rounded-lg transition-colors"
            >
              <p className="text-xs font-semibold text-teal-400 uppercase tracking-wider">Administration</p>
              <ChevronDown className={cn("w-3.5 h-3.5 text-teal-400 transition-transform", administrationExpanded && "rotate-180")} />
            </button>
            {administrationExpanded && adminNavigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                      : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                  <span className="text-sm font-medium">{item.name}</span>
                </Link>
              );
            })}
          </>
        )}

        {collapsed && (
          <>
            {crmNavigation.map((item) => {
              const isActive = currentPageName === item.href;
              return (
                <Link
                  key={item.name}
                  to={createPageUrl(item.href)}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
                    isActive 
                      ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                      : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                  )}
                >
                  <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                </Link>
              );
            })}
            {user?.role === 'admin' && (
              <>
                {configurationNavigation.map((item) => {
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                          : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                    </Link>
                  );
                })}
                {adminNavigation.map((item) => {
                  const isActive = currentPageName === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={createPageUrl(item.href)}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "flex items-center justify-center px-2 py-2.5 rounded-lg transition-all duration-200",
                        isActive 
                          ? "bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg" 
                          : "text-teal-100 hover:text-white hover:bg-teal-800/50"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5 flex-shrink-0")} />
                    </Link>
                  );
                })}
              </>
            )}
          </>
        )}
      </nav>

      {/* Collapse Button - Desktop Only */}
      <div className="hidden md:block p-3 border-t border-teal-900/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full text-teal-100 hover:text-white hover:bg-teal-800/50"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );

  // Hide layout for Home page (it's a public landing page)
  if (currentPageName === 'Home') {
    return children;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        :root {
          --color-primary: #088395;
          --color-primary-dark: #0A4D68;
          --color-teal: #0FA4AF;
          --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
        }
        body {
          font-family: var(--font-sans);
          background: #f8fafc;
        }
      `}</style>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0A4D68] border-b border-teal-900/50 z-50 flex items-center justify-between px-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setMobileOpen(true)}
          className="text-slate-400"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
            <Ship className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-white text-sm">Terminal Compatibility</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-slate-700 text-xs">
                  {user?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-slate-800 border-slate-700">
            <Link to={createPageUrl('Profile')}>
              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
            </Link>
            <Link to={createPageUrl('Preferences')}>
              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Preferences
              </DropdownMenuItem>
            </Link>
            <Link to={createPageUrl('UserSecurity')}>
              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                <Shield className="w-4 h-4 mr-2" />
                Security
              </DropdownMenuItem>
            </Link>
            <Link to={createPageUrl('MyTags')}>
              <DropdownMenuItem className="text-slate-300 cursor-pointer">
                <Tag className="w-4 h-4 mr-2" />
                My Tags
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator className="bg-slate-700" />
            <DropdownMenuItem 
              className="text-red-400"
              onClick={() => {
                clearCurrentUserCache();
                queryClient.removeQueries(['currentUser']);
                base44.auth.logout();
              }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/60 z-50"
          onClick={() => setMobileOpen(false)}
        >
          <div 
            className="w-64 h-full bg-[#0A4D68]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setMobileOpen(false)}
                className="text-slate-400"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <NavContent />
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className={cn(
        "hidden md:block fixed top-0 left-0 h-screen bg-[#0A4D68] border-r border-teal-900/50 z-40 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}>
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className={cn(
        "min-h-screen transition-all duration-300 pt-16 md:pt-0",
        collapsed ? "md:ml-16" : "md:ml-64"
      )}>
        {/* Top Bar - Desktop */}
        <header className="hidden md:flex h-16 bg-white border-b border-gray-200 items-center justify-between px-6 sticky top-0 z-30">
          <div>
            <Breadcrumbs currentPageName={currentPageName} />
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full"></span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 text-gray-700 hover:text-gray-900">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white text-xs">
                      {user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{user?.full_name || 'User'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-gray-200">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{user?.full_name}</p>
                  <p className="text-xs text-gray-600">{user?.email}</p>
                </div>
                <DropdownMenuSeparator className="bg-gray-200" />
                <Link to={createPageUrl('Profile')}>
                  <DropdownMenuItem className="text-gray-700 focus:text-gray-900 focus:bg-gray-100 cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile Settings
                  </DropdownMenuItem>
                </Link>
                <Link to={createPageUrl('Preferences')}>
                  <DropdownMenuItem className="text-gray-700 focus:text-gray-900 focus:bg-gray-100 cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Preferences
                  </DropdownMenuItem>
                </Link>
                <Link to={createPageUrl('UserSecurity')}>
                  <DropdownMenuItem className="text-gray-700 focus:text-gray-900 focus:bg-gray-100 cursor-pointer">
                    <Shield className="w-4 h-4 mr-2" />
                    Security
                  </DropdownMenuItem>
                </Link>
                <Link to={createPageUrl('MyTags')}>
                  <DropdownMenuItem className="text-gray-700 focus:text-gray-900 focus:bg-gray-100 cursor-pointer">
                    <Tag className="w-4 h-4 mr-2" />
                    My Tags
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuSeparator className="bg-gray-200" />
                <DropdownMenuItem 
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                  onClick={() => {
                    clearCurrentUserCache();
                    queryClient.removeQueries(['currentUser']);
                    base44.auth.logout();
                  }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-4 md:p-6 bg-gray-50 min-h-screen">
          {children}
        </div>
      </main>

      {/* Chatbot Widget - Offline Support Assistant */}
      <ChatbotWidget />
    </div>
  );
}