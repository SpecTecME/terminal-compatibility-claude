/**
 * Configuration App Settings Hub Page
 * 
 * PURPOSE:
 * Navigation hub for application-level configuration.
 * Settings that affect how the app behaves for all users.
 * 
 * CURRENT CONFIGURATION AREAS:
 * 
 * 1. EMAIL & NOTIFICATIONS:
 *    - Email server settings (SMTP)
 *    - Notification preferences
 *    - Email templates
 *    - Delivery schedules
 * 
 * 2. TIME & LOCALIZATION:
 *    - Default timezone
 *    - Date/time formats
 *    - Language settings
 *    - Regional preferences
 * 
 * PLACEHOLDER STATUS:
 * Both items currently link to Preferences page.
 * 
 * INTENDED FUTURE STATE:
 * - Dedicated admin pages for email configuration
 * - System-wide timezone management
 * - Multi-language support settings
 * - Regional format customization
 * 
 * Currently using Preferences as catch-all for these settings.
 * 
 * NAVIGATION PATTERN:
 * Same card grid pattern as ConfigurationMasterData.
 * Consistent UX across all configuration hubs.
 * 
 * WHY SEPARATE FROM MASTER DATA:
 * - Different access level (app behavior vs data)
 * - Different change frequency (occasional vs rare)
 * - Different user needs (ops team vs data admin)
 * 
 * RELATED HUBS:
 * - ConfigurationMasterData: Reference data
 * - ConfigurationVesselConfig: Vessel type rules
 * - ConfigurationSystemConfig: Auth, security, workflow
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Bell,
  Globe,
  Map,
  ChevronRight
} from 'lucide-react';

export default function ConfigurationAppSettings() {
  const items = [
    { name: 'Email & Notifications', href: 'Preferences', icon: Bell, description: 'Configure email and notification settings' },
    { name: 'Time & Localization', href: 'Preferences', icon: Globe, description: 'Configure timezone and language settings' },
    { name: 'Map Configuration', href: 'MapConfigurationSettings', icon: Map, description: 'Configure map display, tile source and maritime zone overlays' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Application Settings</h1>
        <p className="text-gray-600 mt-1">Configure email, notifications, and localization</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-3">
            {items.map((item) => (
              <Link key={item.href} to={`/${item.href}`}>
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:border-cyan-500/50 hover:bg-gray-50 transition-all group cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                      <item.icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-cyan-600 transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}