/**
 * Settings Page (Navigation Hub)
 * 
 * PURPOSE:
 * Card-based navigation to major configuration areas.
 * Simplified settings hub with visual cards for discoverability.
 * 
 * ARCHITECTURAL NOTE:
 * This page appears to be a legacy/simplified settings hub.
 * The main navigation now uses Layout.js Configuration sections.
 * 
 * NAVIGATION TARGETS:
 * 
 * 1. AdminUsers:
 *    - User account management
 *    - Invite/remove users
 *    - Role assignment
 * 
 * 2. DocumentTypes:
 *    - Configure document type library
 *    - Set validity rules
 *    - Manage issuing authorities
 * 
 * 3. Terminals:
 *    - Terminal list (not settings, odd choice)
 *    - Likely intended as "Terminal Management Settings"
 *    - Could redirect to TerminalTypes or similar
 * 
 * DESIGN PATTERN:
 * 
 * CARD GRID LAYOUT:
 * - Responsive: 1 column mobile, 2 columns md, 3 columns lg
 * - Equal height cards (h-full)
 * - Hover effects (border color change, background shift)
 * - Visual hierarchy with icons
 * 
 * ICON BADGES:
 * - Gradient backgrounds matching icon theme
 * - Rounded squares (w-12 h-12 rounded-xl)
 * - Semi-transparent (opacity 20%)
 * - Border accent (opacity 30%)
 * 
 * USAGE CONTEXT:
 * May be accessed from:
 * - Direct URL navigation
 * - Legacy bookmarks
 * - Alternative entry point to configuration
 * 
 * MODERN ALTERNATIVE:
 * Most users access settings via Layout.js Configuration accordion.
 * This page could be deprecated or repurposed.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Settings as SettingsIcon, User, FileText, Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your application settings</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to={createPageUrl('AdminUsers')}>
          <Card className="bg-white border-gray-200 hover:bg-gray-50 hover:border-cyan-500/50 transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500/20 to-cyan-600/20 flex items-center justify-center border border-teal-500/30 mb-4">
                <User className="w-6 h-6 text-teal-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
              <p className="text-sm text-gray-600">Manage users, roles, and permissions</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('DocumentTypes')}>
          <Card className="bg-white border-gray-200 hover:bg-gray-50 hover:border-cyan-500/50 transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30 mb-4">
                <FileText className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Types</h3>
              <p className="text-sm text-gray-600">Configure document types and authorities</p>
            </CardContent>
          </Card>
        </Link>

        <Link to={createPageUrl('Terminals')}>
          <Card className="bg-white border-gray-200 hover:bg-gray-50 hover:border-cyan-500/50 transition-all cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center border border-violet-500/30 mb-4">
                <Building2 className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Terminal Management</h3>
              <p className="text-sm text-gray-600">Manage terminals and berths</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}