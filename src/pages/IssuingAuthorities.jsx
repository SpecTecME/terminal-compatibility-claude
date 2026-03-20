/**
 * Issuing Authorities List Page (Master Data Management)
 * 
 * PURPOSE:
 * Registry of organizations that issue maritime documents and certificates.
 * Enables document validation and external code mapping across authority systems.
 * 
 * DOMAIN CONTEXT - WHO ISSUES WHAT:
 * 
 * AUTHORITY TYPES (lines 106-116):
 * 
 * 1. CLASSIFICATION SOCIETY:
 *    - DNV, Lloyd's Register, ABS, Bureau Veritas, etc.
 *    - Issue class certificates, survey reports
 *    - Approve vessel designs and modifications
 *    - IACS members held to high standards
 * 
 * 2. FLAG STATE:
 *    - Country where vessel registered
 *    - Issues statutory certificates (Safety, Pollution, etc.)
 *    - Enforces international conventions (SOLAS, MARPOL)
 *    - Examples: Panama, Liberia, Marshall Islands authorities
 * 
 * 3. PORT STATE:
 *    - Country where vessel calling
 *    - Performs Port State Control inspections
 *    - Can detain non-compliant vessels
 *    - Examples: Paris MoU, Tokyo MoU members
 * 
 * 4. OCIMF:
 *    - Oil Companies International Marine Forum
 *    - Conducts SIRE (Ship Inspection Report) inspections
 *    - Industry standard for tanker vetting
 *    - Accredits inspectors worldwide
 * 
 * 5. TERMINAL:
 *    - Individual terminal issues approval certificates
 *    - Ship/shore compatibility verification
 *    - Terminal-specific requirements
 * 
 * 6. OWNER OR OPERATOR:
 *    - Internal company documents
 *    - Management procedures, checklists
 *    - Not regulatory but operationally required
 * 
 * 7. MANUFACTURER OR SHIPYARD:
 *    - Equipment certificates
 *    - Commissioning reports
 *    - Warranty documentation
 * 
 * 8. ENGINEERING CONSULTANT:
 *    - Third-party assessments
 *    - Technical studies
 *    - Specialized expertise reports
 * 
 * RELATIONSHIP TO COMPANY ENTITY (lines 49-66, 218-224):
 * 
 * companyId links to Company entity:
 * - Optional relationship
 * - Many authorities ARE companies (DNV, LR, etc.)
 * - Some are governmental (not in Company registry)
 * 
 * BENEFITS OF LINKING:
 * - Reuse company contact information
 * - Track company offices globally
 * - Navigate from authority to company profile
 * - See all documents issued by company
 * 
 * USEMEMO OPTIMIZATION (lines 60-66):
 * Builds ID→Name lookup map for fast company name resolution.
 * Prevents O(n²) lookup in table rendering.
 * Pattern: companiesMap[auth.companyId] instead of .find() in loop.
 * 
 * HARD DELETE vs SOFT DELETE:
 * 
 * IssuingAuthority uses HARD DELETE (line 69).
 * Unlike most entities (soft delete with isActive flag).
 * 
 * RATIONALE:
 * - Issuing authorities rarely need deletion
 * - If deleted, usually configuration error (fix by recreating)
 * - External code mappings reference authorities (orphaning acceptable)
 * 
 * RISK:
 * Existing documents may reference deleted authority.
 * TODO: Implement referential integrity check before delete.
 * 
 * THREE VIEW MODES (lines 45, 157-182):
 * Same as other list pages: List, Grid, Compact.
 * Provides flexibility for different user preferences and screen sizes.
 */
import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Plus, Search, Eye, Edit, Trash2, Grid3x3, List, LayoutList, Mail, Globe } from 'lucide-react';
import BackToConfiguration from '../components/configuration/BackToConfiguration';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export default function IssuingAuthorities() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [authToDelete, setAuthToDelete] = useState(null);

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: authorities = [], isLoading } = useQuery({
    queryKey: ['issuingAuthorities'],
    queryFn: () => base44.entities.IssuingAuthority.list(),
    enabled: companies.length > 0
  });

  const companiesMap = useMemo(() => {
    const map = {};
    companies.forEach(c => {
      map[c.id] = c.name;
    });
    return map;
  }, [companies]);

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.IssuingAuthority.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuingAuthorities'] });
      toast.success('Authority deleted');
      setDeleteDialogOpen(false);
      setAuthToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete authority: ' + error.message);
    }
  });

  const handleDeleteClick = (auth, e) => {
    e?.preventDefault();
    e?.stopPropagation();
    setAuthToDelete(auth);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (authToDelete) {
      deleteMutation.mutate(authToDelete.id);
    }
  };

  const filteredAuthorities = authorities
    .filter(a => {
      const matchesSearch =
        a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.authority_type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = typeFilter === 'all' || a.authority_type === typeFilter;

      return matchesSearch && matchesType;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const typeColors = {
    'Classification Society': 'bg-blue-500/10 text-blue-700 border-blue-500/30',
    'Flag State': 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    'Port State': 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30',
    'OCIMF': 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    'Terminal': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    'Owner or Operator': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
    'Manufacturer or Shipyard': 'bg-pink-500/10 text-pink-700 border-pink-500/30',
    'Engineering Consultant': 'bg-indigo-500/10 text-indigo-700 border-indigo-500/30',
    'Other': 'bg-gray-500/10 text-gray-700 border-gray-500/30'
  };

  const allTypes = ['Classification Society', 'Flag State', 'Port State', 'OCIMF', 'Terminal', 'Owner or Operator', 'Manufacturer or Shipyard', 'Engineering Consultant', 'Other'];

  return (
    <div className="space-y-6">
      <BackToConfiguration to="ConfigurationMasterData" label="Back" />
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issuing Authorities</h1>
          <p className="text-gray-600 mt-1">Manage document issuing authorities</p>
        </div>
        <Link to={createPageUrl('AddIssuingAuthority')}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Authority
          </Button>
        </Link>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search authorities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300 text-gray-900"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-white border-gray-200">
            <SelectItem value="all">All Types</SelectItem>
            {allTypes.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('list')}
            className={viewMode === 'list' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <List className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('grid')}
            className={viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <Grid3x3 className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setViewMode('compact')}
            className={viewMode === 'compact' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
          >
            <LayoutList className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredAuthorities.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p>No authorities found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Related Organisation</TableHead>
                    <TableHead className="text-gray-600">Email</TableHead>
                    <TableHead className="text-gray-600">Website</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAuthorities.map((auth) => (
                    <TableRow key={auth.id} className="border-gray-200">
                      <TableCell className="font-medium text-gray-900">{auth.name}</TableCell>
                      <TableCell>
                        <Badge className={`${typeColors[auth.authority_type]} border text-xs`}>
                          {auth.authority_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {auth.companyId ? (
                          <Link to={createPageUrl(`CompanyDetail?id=${auth.companyId}`)}>
                            <span className="text-cyan-600 hover:text-cyan-700 text-sm cursor-pointer">
                              {companiesMap[auth.companyId] || '-'}
                            </span>
                          </Link>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-gray-600 text-sm">{auth.contact_email || '-'}</TableCell>
                      <TableCell>
                        {auth.website ? (
                          <a href={auth.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 text-sm truncate">
                            {auth.website.replace(/^https?:\/\//, '')}
                          </a>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Link to={createPageUrl(`EditIssuingAuthority?id=${auth.id}`)}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-red-500 hover:text-red-700"
                            onClick={(e) => handleDeleteClick(auth, e)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredAuthorities.map((auth) => (
            <Card key={auth.id} className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{auth.name}</h3>
                    <Badge className={`${typeColors[auth.authority_type]} border text-xs mt-2`}>
                      {auth.authority_type}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Link to={createPageUrl(`EditIssuingAuthority?id=${auth.id}`)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {auth.companyId && (
                    <div className="mb-2">
                      <p className="text-gray-600 text-xs mb-1">Organisation:</p>
                      <Link to={createPageUrl(`CompanyDetail?id=${auth.companyId}`)}>
                        <p className="text-cyan-600 hover:text-cyan-700 cursor-pointer font-medium">
                          {companiesMap[auth.companyId] || '-'}
                        </p>
                      </Link>
                    </div>
                  )}
                  {auth.contact_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-gray-600 truncate">{auth.contact_email}</span>
                    </div>
                  )}
                  {auth.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 text-slate-500" />
                      <a href={auth.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:text-cyan-700 truncate">
                        {auth.website.replace(/^https?:\/\//, '')}
                      </a>
                    </div>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-4 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteClick(auth, e)}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredAuthorities.map((auth) => (
                <div key={auth.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{auth.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${typeColors[auth.authority_type]} border text-xs`}>
                        {auth.authority_type}
                      </Badge>
                      {auth.companyId && (
                        <Link to={createPageUrl(`CompanyDetail?id=${auth.companyId}`)}>
                          <span className="text-cyan-600 hover:text-cyan-700 text-xs cursor-pointer">
                            {companiesMap[auth.companyId] || '-'}
                          </span>
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <Link to={createPageUrl(`EditIssuingAuthority?id=${auth.id}`)}>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <Edit className="w-3 h-3" />
                      </Button>
                    </Link>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-red-500 hover:text-red-700"
                      onClick={(e) => handleDeleteClick(auth, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Authority</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{authToDelete?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}