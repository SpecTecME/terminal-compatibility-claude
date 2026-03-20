/**
 * Audit Log Page (System Activity Tracking)
 * 
 * PURPOSE:
 * View all data changes across the system for compliance and debugging.
 * Field-level granularity for complete change tracking.
 * 
 * DOMAIN CONTEXT - AUDIT TRAIL:
 * 
 * WHY AUDIT LOGS:
 * Maritime industry heavily regulated:
 * - ISO 9001: Document change tracking
 * - SOC 2: Access and modification logs
 * - Internal compliance: Who changed what when
 * 
 * INVESTIGATIONS:
 * - "Why did this vessel's status change?"
 * - "Who modified this document's expiry date?"
 * - "When was this terminal deactivated?"
 * 
 * FIELD-LEVEL LOGGING:
 * Each field change = separate log entry.
 * Complete reconstruction of history possible.
 * 
 * COMPREHENSIVE FILTERS:
 * 
 * 1. SEARCH (line 92-99):
 *    Text search across:
 *    - Table name
 *    - User email
 *    - Field name
 *    
 *    Helps find specific changes quickly.
 * 
 * 2. DATE RANGE (lines 101-116):
 *    From/To date pickers.
 *    
 *    FILTERING LOGIC (lines 49-62):
 *    - Sets time to start of day (00:00:00) for dateFrom
 *    - Sets time to end of day (23:59:59) for dateTo
 *    - Inclusive range
 *    
 *    USE CASES:
 *    - "Show all changes on January 10"
 *    - "What changed last week?"
 *    - "Audit quarter report"
 * 
 * 3. TABLE FILTER (lines 117-127):
 *    Dropdown of entity types.
 *    
 *    DYNAMIC OPTIONS (line 67):
 *    Extracts unique table names from existing logs.
 *    Shows only tables that have activity.
 *    
 *    EXAMPLES:
 *    - Vessel
 *    - Terminal
 *    - Document
 *    - Company
 * 
 * 4. ACTION FILTER (lines 128-138):
 *    Type of operation:
 *    - Create: New record
 *    - Update: Field changed
 *    - Delete: Record removed
 * 
 * 5. STATUS FILTER (lines 294-314):
 *    Validity status:
 *    - Valid, Expiring Soon, Expired (for documents)
 *    
 *    NOTE: This seems document-specific, may not apply to all logs.
 * 
 * ACTION COLOR CODING (lines 69-73):
 * Visual differentiation:
 * - Create: Green (emerald)
 * - Update: Cyan
 * - Delete: Red
 * 
 * Instant recognition of change type.
 * 
 * TABLE COLUMNS:
 * 
 * TIMESTAMP (line 161, 174-178):
 * When change occurred.
 * Format: "Jan 12, 2026 14:30".
 * Calendar icon for visual clarity.
 * 
 * ACTION (line 162, 180-183):
 * Color-coded badge (Create/Update/Delete).
 * 
 * TABLE (line 163, 185):
 * Entity type (Vessel, Terminal, etc.).
 * 
 * FIELD (line 164, 186):
 * Specific field modified.
 * "-" if not applicable (Create/Delete operations).
 * 
 * PREVIOUS VALUE (line 165, 187):
 * Value before change.
 * Truncated for long values (max-w-xs truncate).
 * 
 * NEW VALUE (line 166, 188):
 * Value after change.
 * Also truncated.
 * 
 * USER (line 167, 189-193):
 * Who made the change.
 * Shows email or name.
 * User icon for visual clarity.
 * 
 * ACTIONS (line 168, 195-201):
 * Eye icon → View detail page.
 * Shows full change context.
 * 
 * SORT ORDER (line 37):
 * '-timestamp' = Descending.
 * Most recent changes first.
 * Standard chronological audit pattern.
 * 
 * EMPTY STATE (lines 145-154):
 * Two scenarios:
 * - Filters active: "Try adjusting your filters"
 * - No filters: "Audit logs will appear here as changes are made"
 * 
 * Contextual empty messages.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, Search, Eye, Calendar, User as UserIcon, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

export default function AuditLog() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTable, setFilterTable] = useState('all');
  const [filterAction, setFilterAction] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: () => base44.entities.AuditLog.list('-timestamp')
  });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.tableName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.userEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.fieldName?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTable = filterTable === 'all' || log.tableName === filterTable;
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    
    let matchesDateRange = true;
    if (log.timestamp) {
      const logDate = new Date(log.timestamp);
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDateRange = matchesDateRange && logDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDateRange = matchesDateRange && logDate <= toDate;
      }
    }
    
    return matchesSearch && matchesTable && matchesAction && matchesDateRange;
  });

  const uniqueTables = [...new Set(logs.map(l => l.tableName))].filter(Boolean);

  const actionColors = {
    'Create': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'Update': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'Delete': 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Dashboard')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-gray-600 mt-1">Track all system changes and user activities</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by table, user, or field..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <div className="flex gap-2">
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            placeholder="From date"
            className="w-40 bg-white border-gray-300"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            placeholder="To date"
            className="w-40 bg-white border-gray-300"
          />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300">
            <SelectValue placeholder="Filter by table" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tables</SelectItem>
            {uniqueTables.map(table => (
              <SelectItem key={table} value={table}>{table}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterAction} onValueChange={setFilterAction}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300">
            <SelectValue placeholder="Filter by action" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="Create">Create</SelectItem>
            <SelectItem value="Update">Update</SelectItem>
            <SelectItem value="Delete">Delete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No audit logs found</h3>
          <p className="text-gray-600">
            {searchQuery || filterTable !== 'all' || filterAction !== 'all' || dateFrom || dateTo
              ? 'Try adjusting your filters' 
              : 'Audit logs will appear here as changes are made'}
          </p>
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Timestamp</TableHead>
                  <TableHead className="text-gray-600">Action</TableHead>
                  <TableHead className="text-gray-600">Table</TableHead>
                  <TableHead className="text-gray-600">Field</TableHead>
                  <TableHead className="text-gray-600">Previous Value</TableHead>
                  <TableHead className="text-gray-600">New Value</TableHead>
                  <TableHead className="text-gray-600">User</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id} className="border-gray-200">
                    <TableCell className="text-gray-700">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        {log.timestamp ? format(new Date(log.timestamp), 'MMM d, yyyy HH:mm') : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`${actionColors[log.action] || 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border`}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-gray-900">{log.tableName}</TableCell>
                    <TableCell className="text-gray-700">{log.fieldName || '-'}</TableCell>
                    <TableCell className="text-gray-700 max-w-xs truncate">{log.previousValue || '-'}</TableCell>
                    <TableCell className="text-gray-700 max-w-xs truncate">{log.newValue || '-'}</TableCell>
                    <TableCell className="text-gray-700">
                      <div className="flex items-center gap-2">
                        <UserIcon className="w-3.5 h-3.5 text-gray-500" />
                        <span className="truncate">{log.userEmail || log.userName || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link to={createPageUrl(`AuditLogDetail?id=${log.id}`)}>
                        <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}