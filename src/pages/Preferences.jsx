/**
 * User Preferences Page (Personal Settings)
 * 
 * PURPOSE:
 * User-specific configuration for display, notifications, and regional settings.
 * Does NOT affect security (see SecurityPolicies for org-wide rules).
 * 
 * SINGLETON PER USER (lines 37-44):
 * Each user has ONE UserPreference record.
 * Query filters by userId.
 * 
 * CREATE OR UPDATE (lines 82-94):
 * - Has preferences: Update existing (line 85)
 * - No preferences: Create first record (lines 87-93)
 * 
 * FOUR PREFERENCE CATEGORIES (Tabs):
 * 
 * ========================================
 * 1. LOCALIZATION & FORMATTING (lines 147-216)
 * ========================================
 * 
 * TIME ZONE (line 155-172):
 * User's preferred timezone for date/time display.
 * 
 * COMMON ZONES:
 * - UTC: Universal standard
 * - Asia/Dubai: Middle East operations
 * - Europe/London: UK/Europe
 * - America/New_York: US East Coast
 * - Asia/Singapore, Asia/Hong_Kong, Asia/Tokyo: Asia-Pacific
 * 
 * USAGE:
 * System converts all times to user's zone.
 * Critical for global teams (avoid confusion).
 * 
 * DATE FORMAT (line 174-186):
 * How dates displayed:
 * - DD/MM/YYYY: European standard (12/01/2026 = Jan 12)
 * - MM/DD/YYYY: US standard (01/12/2026 = Jan 12)
 * - YYYY-MM-DD: ISO standard (2026-01-12)
 * 
 * Prevents date ambiguity in international teams.
 * 
 * TIME FORMAT (line 188-199):
 * - 24H: 14:30 (international)
 * - 12H: 2:30 PM (US preference)
 * 
 * WEEK START DAY (line 201-212):
 * Calendar week start:
 * - Monday: ISO standard, most countries
 * - Sunday: US, Middle East preference
 * 
 * ========================================
 * 2. NOTIFICATIONS (lines 218-277)
 * ========================================
 * 
 * EMAIL NOTIFICATIONS (line 226-235):
 * Receive alerts via email.
 * 
 * IN-APP NOTIFICATIONS (line 237-246):
 * Show in-app notification badges/popups.
 * 
 * REMINDER LEAD TIME (line 248-260):
 * How many days before expiry to remind.
 * 
 * DEFAULT (line 53): 14 days.
 * Range: 1-365 days.
 * 
 * EXAMPLES:
 * - 7 days: Last-minute reminder
 * - 30 days: Advance planning
 * 
 * AFFECTS:
 * Document expiry reminders, certificate renewals.
 * 
 * NOTIFICATION DIGEST (line 262-274):
 * Email frequency:
 * - Instant: Immediate (real-time)
 * - Daily: Once per day summary
 * - Weekly: Once per week digest
 * 
 * TRADE-OFF:
 * - Instant: Stay informed, email overload
 * - Digest: Less noise, delayed awareness
 * 
 * ========================================
 * 3. UI PREFERENCES (lines 279-330)
 * ========================================
 * 
 * DEFAULT LANDING PAGE (line 287-302):
 * Where to navigate after login.
 * 
 * OPTIONS:
 * - Dashboard: Overview/analytics
 * - WorldMap: Geographic terminal view
 * - Terminals: Terminal list
 * - Fleet: Vessel list
 * - Documents: Document management
 * 
 * PERSONALIZATION:
 * Users go straight to their main workflow.
 * 
 * TABLE DENSITY (line 304-316):
 * Row spacing in data tables:
 * - Compact: More rows, less padding
 * - Comfortable: Balanced (default)
 * - Spacious: Easier to read, fewer rows
 * 
 * USER PREFERENCE:
 * Small screens → compact.
 * Large monitors → spacious.
 * 
 * REMEMBER LAST FILTERS (line 318-327):
 * Persist filter selections across sessions.
 * 
 * ENABLED:
 * - User filters vessels by "Active" status
 * - Navigates away
 * - Returns → Filter still "Active"
 * 
 * DISABLED:
 * - Always reset to default filters
 * 
 * ========================================
 * 4. REGIONAL & CULTURAL (lines 332-367)
 * ========================================
 * 
 * HOLIDAY AWARENESS (line 340-349):
 * Show regional holidays in calendar views.
 * 
 * EXAMPLES:
 * - Eid holidays (Middle East)
 * - Chinese New Year (Asia)
 * - Christmas (Western)
 * 
 * USAGE:
 * Planning around non-working days.
 * 
 * GREETING STYLE (line 351-364):
 * How system addresses user:
 * - Formal: "Dear Mr. Smith"
 * - Neutral: "Hello John Smith"
 * - Friendly: "Hi John!"
 * 
 * CULTURAL SENSITIVITY:
 * Different regions have different norms.
 * Middle East → formal.
 * Tech companies → friendly.
 * 
 * DEFAULT VALUES (lines 46-60):
 * Sensible international defaults:
 * - UTC timezone (neutral)
 * - DD/MM/YYYY (international standard)
 * - 24H time (unambiguous)
 * - Monday week start (ISO 8601)
 * - All notifications enabled
 * - 14-day reminder lead
 * - Dashboard landing page
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Save, User, Bell, Layout, Globe, Tag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';
import { getCurrentUserCached } from '../components/utils/currentUser';

export default function Preferences() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await getCurrentUserCached();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const prefs = await base44.entities.UserPreference.filter({ userId: user.id });
      return prefs[0];
    },
    enabled: !!user
  });

  const [formData, setFormData] = useState({
    timeZone: 'UTC',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24H',
    weekStartDay: 'Monday',
    emailNotificationsEnabled: true,
    inAppNotificationsEnabled: true,
    defaultReminderLeadDays: 14,
    notificationDigest: 'Instant',
    defaultLandingPage: 'Dashboard',
    tableDensity: 'Comfortable',
    rememberLastFilters: true,
    holidayAwarenessEnabled: false,
    greetingStyle: 'Neutral'
  });

  useEffect(() => {
    if (preferences) {
      setFormData({
        timeZone: preferences.timeZone || 'UTC',
        dateFormat: preferences.dateFormat || 'DD/MM/YYYY',
        timeFormat: preferences.timeFormat || '24H',
        weekStartDay: preferences.weekStartDay || 'Monday',
        emailNotificationsEnabled: preferences.emailNotificationsEnabled ?? true,
        inAppNotificationsEnabled: preferences.inAppNotificationsEnabled ?? true,
        defaultReminderLeadDays: preferences.defaultReminderLeadDays || 14,
        notificationDigest: preferences.notificationDigest || 'Instant',
        defaultLandingPage: preferences.defaultLandingPage || 'Dashboard',
        tableDensity: preferences.tableDensity || 'Comfortable',
        rememberLastFilters: preferences.rememberLastFilters ?? true,
        holidayAwarenessEnabled: preferences.holidayAwarenessEnabled ?? false,
        greetingStyle: preferences.greetingStyle || 'Neutral'
      });
    }
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (preferences) {
        return await base44.entities.UserPreference.update(preferences.id, data);
      } else {
        return await base44.entities.UserPreference.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          userId: user.id,
          userPublicId: user.publicId || crypto.randomUUID(),
          ...data
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userPreferences']);
      toast.success('Preferences saved successfully');
    },
    onError: (error) => {
      toast.error('Failed to save preferences: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Preferences</h1>
        <p className="text-gray-600 mt-1">Customize your personal settings</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Tabs defaultValue="localization" className="space-y-6">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="localization" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Localization
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="ui" className="flex items-center gap-2">
              <Layout className="w-4 h-4" />
              UI Preferences
            </TabsTrigger>
            <TabsTrigger value="regional" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Regional
            </TabsTrigger>
          </TabsList>

          {/* Localization & Formatting */}
          <TabsContent value="localization">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Localization & Formatting</CardTitle>
                <CardDescription>Configure date, time, and regional settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="timeZone" className="text-gray-700">Time Zone</Label>
                    <Select value={formData.timeZone} onValueChange={(value) => setFormData({...formData, timeZone: value})}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="UTC">UTC</SelectItem>
                        <SelectItem value="Asia/Dubai">Asia/Dubai (UTC+4)</SelectItem>
                        <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                        <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                        <SelectItem value="Asia/Singapore">Asia/Singapore (UTC+8)</SelectItem>
                        <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</SelectItem>
                        <SelectItem value="Asia/Tokyo">Asia/Tokyo (UTC+9)</SelectItem>
                        <SelectItem value="Australia/Sydney">Australia/Sydney (UTC+11)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat" className="text-gray-700">Date Format</Label>
                    <Select value={formData.dateFormat} onValueChange={(value) => setFormData({...formData, dateFormat: value})}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeFormat" className="text-gray-700">Time Format</Label>
                    <Select value={formData.timeFormat} onValueChange={(value) => setFormData({...formData, timeFormat: value})}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="24H">24 Hour</SelectItem>
                        <SelectItem value="12H">12 Hour (AM/PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weekStartDay" className="text-gray-700">Week Starts On</Label>
                    <Select value={formData.weekStartDay} onValueChange={(value) => setFormData({...formData, weekStartDay: value})}>
                      <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Monday">Monday</SelectItem>
                        <SelectItem value="Sunday">Sunday</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications */}
          <TabsContent value="notifications">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Notification Settings</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-900">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={formData.emailNotificationsEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, emailNotificationsEnabled: checked})}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-900">In-App Notifications</Label>
                    <p className="text-sm text-gray-600">Show notifications within the app</p>
                  </div>
                  <Switch
                    checked={formData.inAppNotificationsEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, inAppNotificationsEnabled: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultReminderLeadDays" className="text-gray-700">Default Reminder Lead Time (Days)</Label>
                  <Input
                    id="defaultReminderLeadDays"
                    type="number"
                    value={formData.defaultReminderLeadDays}
                    onChange={(e) => setFormData({...formData, defaultReminderLeadDays: parseInt(e.target.value)})}
                    className="bg-white border-gray-300 text-gray-900"
                    min="1"
                    max="365"
                  />
                  <p className="text-xs text-gray-600">Default days before expiry to send reminders</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notificationDigest" className="text-gray-700">Notification Digest</Label>
                  <Select value={formData.notificationDigest} onValueChange={(value) => setFormData({...formData, notificationDigest: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Instant">Instant - as they happen</SelectItem>
                      <SelectItem value="Daily">Daily - once per day</SelectItem>
                      <SelectItem value="Weekly">Weekly - once per week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* UI Preferences */}
          <TabsContent value="ui">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">UI Preferences</CardTitle>
                <CardDescription>Customize your interface experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="defaultLandingPage" className="text-gray-700">Default Landing Page</Label>
                  <Select value={formData.defaultLandingPage} onValueChange={(value) => setFormData({...formData, defaultLandingPage: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dashboard">Dashboard</SelectItem>
                      <SelectItem value="WorldMap">World Map</SelectItem>
                      <SelectItem value="Terminals">Terminals</SelectItem>
                      <SelectItem value="Fleet">Fleet</SelectItem>
                      <SelectItem value="Documents">Documents</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">Page to display after login</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tableDensity" className="text-gray-700">Table Density</Label>
                  <Select value={formData.tableDensity} onValueChange={(value) => setFormData({...formData, tableDensity: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Compact">Compact - more rows visible</SelectItem>
                      <SelectItem value="Comfortable">Comfortable - balanced</SelectItem>
                      <SelectItem value="Spacious">Spacious - easier to read</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-900">Remember Last Filters</Label>
                    <p className="text-sm text-gray-600">Restore your last used filters when returning to a page</p>
                  </div>
                  <Switch
                    checked={formData.rememberLastFilters}
                    onCheckedChange={(checked) => setFormData({...formData, rememberLastFilters: checked})}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Regional & Cultural */}
          <TabsContent value="regional">
            <Card className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-gray-900">Regional & Cultural Settings</CardTitle>
                <CardDescription>Configure cultural and regional preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-gray-900">Holiday Awareness</Label>
                    <p className="text-sm text-gray-600">Show regional holidays in calendar views</p>
                  </div>
                  <Switch
                    checked={formData.holidayAwarenessEnabled}
                    onCheckedChange={(checked) => setFormData({...formData, holidayAwarenessEnabled: checked})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="greetingStyle" className="text-gray-700">Greeting Style</Label>
                  <Select value={formData.greetingStyle} onValueChange={(value) => setFormData({...formData, greetingStyle: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Formal">Formal - Dear Mr./Ms.</SelectItem>
                      <SelectItem value="Neutral">Neutral - Hello [Name]</SelectItem>
                      <SelectItem value="Friendly">Friendly - Hi [Name]!</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-600">How the system greets you</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-3">
          <Button
            type="submit"
            disabled={saveMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
}