import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { FileText, Search, Eye, Plus } from 'lucide-react';
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

/**
 * Registration Applications List Page
 * 
 * PURPOSE:
 * Master list of all terminal registration applications across the system.
 * Provides filtering, search, and navigation to individual application details.
 * 
 * CONTEXT-AWARE FILTERING:
 * Can be embedded in other pages with pre-filters:
 * - ?terminalId=x → Show only applications for specific terminal
 * - ?vesselId=x → Show only applications for specific vessel
 * - No params → Show all applications globally
 * 
 * USAGE PATTERNS:
 * 1. Standalone page (view all applications system-wide)
 * 2. Embedded in VesselDetail page (see registrations for this vessel)
 * 3. Embedded in TerminalDetail page (see vessels registered at this terminal)
 * 
 * IFRAME EMBEDDING:
 * This page is designed to work both standalone AND within iframe.
 * When embedded (e.g., in VesselDetail), filterVesselId automatically applied.
 * 
 * STATUS LIFECYCLE:
 * DRAFT → IN_PROGRESS → READY_TO_SUBMIT → SUBMITTED → UNDER_REVIEW → APPROVED
 * Alternative endings: REJECTED, ON_HOLD, SUSPENDED, CANCELLED
 * 
 * SEARCH FIELDS:
 * - Application number (REG-XXXXXX)
 * - Terminal name
 * - Vessel name
 * - IMO number (vessel identifier)
 * 
 * Multi-entity search enables finding applications through any dimension.
 */
export default function RegistrationApplications() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Optional pre-filters from parent pages
  const filterTerminalId = urlParams.get('terminalId');
  const filterVesselId = urlParams.get('vesselId');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['registrationApplications'],
    queryFn: () => base44.entities.TerminalRegistrationApplication.list('-updated_date')
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const filteredApplications = applications.filter(app => {
    if (filterTerminalId && app.terminalId !== filterTerminalId) return false;
    if (filterVesselId && app.vesselId !== filterVesselId) return false;

    const terminal = terminals.find(t => t.id === app.terminalId);
    const vessel = vessels.find(v => v.id === app.vesselId);

    const matchesSearch = 
      app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel?.imo_number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    'DRAFT': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    'IN_PROGRESS': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
    'READY_TO_SUBMIT': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    'SUBMITTED': 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    'UNDER_REVIEW': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'APPROVED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    'REJECTED': 'bg-red-500/10 text-red-400 border-red-500/30',
    'ON_HOLD': 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    'SUSPENDED': 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    'CANCELLED': 'bg-red-500/10 text-red-400 border-red-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Registration Applications</h1>
          <p className="text-gray-600 mt-1">Manage vessel registration applications</p>
        </div>
        <Link to={createPageUrl('RegistrationEntrypoint')}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by application number, terminal, vessel, or IMO..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-48 bg-white border-gray-300">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="READY_TO_SUBMIT">Ready to Submit</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="ON_HOLD">On Hold</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No applications found</h3>
          <p className="text-gray-600 mb-6">
            {searchQuery || filterStatus !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Start a new registration application'}
          </p>
          <Link to={createPageUrl('RegistrationEntrypoint')}>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              New Application
            </Button>
          </Link>
        </div>
      ) : (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Application #</TableHead>
                  <TableHead className="text-gray-600">Terminal</TableHead>
                  <TableHead className="text-gray-600">Vessel</TableHead>
                  <TableHead className="text-gray-600">Status</TableHead>
                  <TableHead className="text-gray-600">Updated</TableHead>
                  <TableHead className="text-gray-600 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredApplications.map((app) => {
                  const terminal = terminals.find(t => t.id === app.terminalId);
                  const vessel = vessels.find(v => v.id === app.vesselId);

                  return (
                    <TableRow key={app.id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">
                        {app.applicationNumber}
                      </TableCell>
                      <TableCell className="text-gray-700">{terminal?.name || '-'}</TableCell>
                      <TableCell className="text-gray-700">
                        {vessel?.name || '-'}
                        {vessel?.imo_number && (
                          <span className="text-xs text-gray-500 block">
                            IMO: {vessel.imo_number}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[app.status]} border`}>
                          {app.status.replace(/_/g, ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {app.updated_date ? format(new Date(app.updated_date), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link to={createPageUrl(`Registration?applicationId=${app.id}`)}>
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}