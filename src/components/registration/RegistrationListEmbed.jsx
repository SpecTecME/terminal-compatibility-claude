import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { FileText, Search, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
 * Registration List Embed Component
 * 
 * PURPOSE:
 * Embeddable registration applications list for Terminal and Vessel detail pages.
 * Displays filtered applications without page header/nav, optimized for tab embedding.
 * 
 * PROPS:
 * - terminalId: Filter to show only applications for this terminal
 * - vesselId: Filter to show only applications for this vessel
 * 
 * DESIGN DECISIONS:
 * - No page header (embedded in parent's tab)
 * - Minimal UI (no "New Application" button - parent provides)
 * - Actions column links to Registration page with applicationId
 * - Fully self-contained (fetches own data)
 */
export default function RegistrationListEmbed({ terminalId, vesselId }) {
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

  const filteredApplications = applications.filter(app => {
    // Pre-filter by terminal or vessel
    if (terminalId && app.terminalId !== terminalId) return false;
    if (vesselId && app.vesselId !== vesselId) return false;

    const terminal = terminals.find(t => t.id === app.terminalId);
    const vessel = vessels.find(v => v.id === app.vesselId);

    // Search filter
    const matchesSearch = 
      app.applicationNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      terminal?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vessel?.imoNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (filteredApplications.length === 0 && !searchQuery && filterStatus === 'all') {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No registration applications yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
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

      {filteredApplications.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">No applications match your filters</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="text-gray-600">Application #</TableHead>
              {!terminalId && <TableHead className="text-gray-600">Terminal</TableHead>}
              {!vesselId && <TableHead className="text-gray-600">Vessel</TableHead>}
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
                  {!terminalId && (
                    <TableCell className="text-gray-700">{terminal?.name || '-'}</TableCell>
                  )}
                  {!vesselId && (
                    <TableCell className="text-gray-700">
                      {vessel?.name || '-'}
                      {vessel?.imoNumber && (
                        <span className="text-xs text-gray-500 block">
                          IMO: {vessel.imoNumber}
                        </span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge className={`${statusColors[app.status]} border`}>
                      {app.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-700">
                    {app.updated_date ? format(new Date(app.updated_date), 'MMM d, yyyy') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={createPageUrl(`RegistrationEntrypoint?applicationId=${app.id}`)}>
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
      )}
    </div>
  );
}