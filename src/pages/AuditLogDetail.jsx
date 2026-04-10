/**
 * Audit Log Detail Page (Single Change View)
 * 
 * PURPOSE:
 * Detailed view of a single audit log entry with full context.
 * Shows all metadata, user agent, IP, and value changes.
 * 
 * HEADER SECTION (lines 50-57):
 * 
 * Action badge in header (color-coded).
 * Immediately shows change type.
 * 
 * BASIC INFORMATION (lines 60-85):
 * 
 * TABLE NAME (line 62-67):
 * Entity type (Vessel, Terminal, etc.).
 * FileText icon for visual consistency.
 * 
 * RECORD ID (line 69-72):
 * Internal database ID.
 * Monospace font (technical identifier).
 * 
 * PUBLIC ID (lines 73-78):
 * Migration-portable UUID.
 * Only shown if exists.
 * Also monospace.
 * 
 * FIELD MODIFIED (lines 79-84):
 * Which field changed.
 * Only shown for Update actions.
 * Create/Delete affect whole record.
 * 
 * METADATA SECTION (lines 86-112):
 * 
 * TIMESTAMP (line 87-94):
 * Full date/time with seconds.
 * Format: "January 12, 2026 2:30:45 PM".
 * More detailed than list view.
 * 
 * USER (line 96-104):
 * Who made change.
 * Shows both name and email if available.
 * UserIcon for visual clarity.
 * 
 * IP ADDRESS (lines 106-111):
 * Source IP of the change.
 * Only shown if logged.
 * Monospace font (technical data).
 * 
 * SECURITY USE:
 * Detect unauthorized access.
 * Geographic anomaly detection.
 * 
 * VALUE CHANGES PANEL (lines 115-133):
 * 
 * CONDITIONAL RENDERING (line 115):
 * Only for Update actions.
 * Only if previousValue or newValue exist.
 * 
 * TWO-COLUMN DIFF (lines 118-131):
 * 
 * PREVIOUS VALUE (lines 119-123):
 * - Red background (deletion metaphor)
 * - Shows old value
 * - "Before" state
 * 
 * NEW VALUE (lines 125-130):
 * - Green background (addition metaphor)
 * - Shows new value
 * - "After" state
 * 
 * VISUAL DIFF:
 * Side-by-side comparison.
 * Color-coded for quick comprehension.
 * 
 * BREAK-WORDS (line 122, 128):
 * Long values wrap properly.
 * Prevents horizontal overflow.
 * 
 * USER AGENT SECTION (lines 135-143):
 * 
 * Browser/device information.
 * Only shown if logged.
 * 
 * EXAMPLE:
 * "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
 * 
 * USES:
 * - Identify device type
 * - Security forensics
 * - Browser compatibility issues
 * 
 * Monitor icon (computer screen).
 * break-all class (long strings wrap).
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Calendar, User as UserIcon, FileText, Monitor } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

export default function AuditLogDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const logId = urlParams.get('id');

  const { data: log, isLoading } = useQuery({
    queryKey: ['auditLog', logId],
    queryFn: () => base44.entities.AuditLog.filter({ id: logId }).then(r => r[0]),
    enabled: !!logId
  });

  const actionColors = {
    'Create': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Update': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'Delete': 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  if (isLoading || !log) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Log Detail</h1>
          <p className="text-gray-600 mt-1">View detailed information about this change</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-gray-900">Change Information</CardTitle>
            <Badge className={`${actionColors[log.action] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border`}>
              {log.action}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Table Name</p>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900 font-medium">{log.tableName}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Record ID</p>
                <p className="text-gray-900 font-mono text-sm">{log.recordId}</p>
              </div>
              {log.recordPublicId && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Public ID</p>
                  <p className="text-gray-900 font-mono text-sm">{log.recordPublicId}</p>
                </div>
              )}
              {log.fieldName && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Field Modified</p>
                  <p className="text-gray-900 font-medium">{log.fieldName}</p>
                </div>
              )}
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Timestamp</p>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <p className="text-gray-900 font-medium">
                    {log.timestamp ? format(new Date(log.timestamp), 'MMMM d, yyyy h:mm:ss a') : '-'}
                  </p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">User</p>
                <div className="flex items-center gap-2">
                  <UserIcon className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-gray-900 font-medium">{log.userName || log.userEmail}</p>
                    {log.userName && <p className="text-sm text-gray-600">{log.userEmail}</p>}
                  </div>
                </div>
              </div>
              {log.ipAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">IP Address</p>
                  <p className="text-gray-900 font-mono text-sm">{log.ipAddress}</p>
                </div>
              )}
            </div>
          </div>

          {log.action === 'Update' && (log.previousValue || log.newValue) && (
            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-sm font-semibold text-gray-900 mb-4">Value Changes</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Previous Value</p>
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-gray-900 text-sm break-words">{log.previousValue || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">New Value</p>
                  <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                    <p className="text-gray-900 text-sm break-words">{log.newValue || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {log.userAgent && (
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">User Agent</p>
              <div className="flex items-start gap-2">
                <Monitor className="w-4 h-4 text-gray-500 mt-0.5" />
                <p className="text-gray-700 text-sm break-all">{log.userAgent}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}