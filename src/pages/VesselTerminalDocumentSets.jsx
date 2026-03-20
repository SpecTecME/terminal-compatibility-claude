import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Ship, Building2, Plus, Search, FileText, Loader2 } from 'lucide-react';

export default function VesselTerminalDocumentSets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: documentSets = [], isLoading } = useQuery({
    queryKey: ['vesselTerminalDocumentSets'],
    queryFn: () => base44.entities.VesselTerminalDocumentSet.list('-updated_date')
  });

  const { data: vessels = [] } = useQuery({
    queryKey: ['vessels'],
    queryFn: () => base44.entities.Vessel.list()
  });

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: berths = [] } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const enrichedSets = documentSets.map(set => ({
    ...set,
    vessel: vessels.find(v => v.id === set.vesselId),
    terminal: terminals.find(t => t.id === set.terminalId),
    berth: set.berthId ? berths.find(b => b.id === set.berthId) : null
  }));

  const filteredSets = enrichedSets.filter(set => {
    const matchesSearch = !searchQuery || 
      set.vessel?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.terminal?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || set.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const statusColors = {
    DRAFT: 'bg-gray-100 text-gray-800',
    ACTIVE: 'bg-green-100 text-green-800',
    ARCHIVED: 'bg-slate-100 text-slate-600'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vessel Terminal Document Sets</h1>
          <p className="text-gray-600 mt-1">Manual document requirements per vessel-terminal combination</p>
        </div>
        <Link to={createPageUrl('AddVesselTerminalDocumentSet')}>
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700">
            <Plus className="w-4 h-4 mr-2" />
            Create Document Set
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by vessel or terminal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Vessel</TableHead>
              <TableHead>Terminal</TableHead>
              <TableHead>Berth</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                  <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p className="font-medium">No document sets found</p>
                  <p className="text-sm">Create your first vessel-terminal document set to get started</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredSets.map(set => (
                <TableRow key={set.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Ship className="w-4 h-4 text-teal-600" />
                      <span className="font-medium">{set.vessel?.name || 'Unknown Vessel'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-cyan-600" />
                      <span>{set.terminal?.name || 'Unknown Terminal'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {set.berth?.berth_number || set.berth?.berthName || '—'}
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColors[set.status]}>
                      {set.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {new Date(set.updated_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={createPageUrl(`EditVesselTerminalDocumentSet?id=${set.id}`)}>
                      <Button variant="outline" size="sm">
                        Manage
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}