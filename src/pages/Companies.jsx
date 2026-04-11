import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Building2, Plus, Search, Eye, Edit, Trash2, Globe, Grid3x3, List, LayoutList, Tag, X } from 'lucide-react';
import UserTagManager from '../components/tags/UserTagManager';
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

/**
 * Companies List Page (CRM Module)
 * 
 * PURPOSE:
 * Central directory for all organizations involved in maritime operations.
 * Companies can serve multiple roles: operators, owners, service providers, authorities, etc.
 * 
 * DOMAIN MODEL:
 * Companies are core entities that participate in multiple relationships:
 * - Own vessels (ship owners)
 * - Operate terminals (terminal operators)
 * - Provide classification services (class societies - IACS members)
 * - Issue certifications (flag states, port authorities)
 * - Manage vessels (technical/commercial managers)
 * - Serve terminals (agents, service providers)
 * 
 * KEY ARCHITECTURAL FEATURES:
 * 
 * 1. MULTI-ROLE SYSTEM:
 *    - Single company can have multiple roles across different contexts
 *    - Primary role stored in 'type' field for categorization
 *    - Additional roles tracked via SystemTag assignments
 *    - Example: A company might be both "Operator" and "Owner"
 * 
 * 2. SYSTEM TAGS FOR CLASSIFICATION:
 *    - SystemTags provide machine-readable classifications
 *    - Used for filtering (e.g., show only "Classification Society" companies)
 *    - Tags include: "IACS Member", "Ship Owner", "Terminal Operator", etc.
 *    - Enables complex filtering without rigid schema changes
 * 
 * 3. USER TAGS FOR PERSONAL ORGANIZATION:
 *    - Users can apply personal tags to companies
 *    - Supports individual workflow organization
 *    - Not visible to other users (privacy)
 *    - Example: "Preferred Vendor", "Key Client", "Under Review"
 * 
 * 4. COUNTRY RELATIONSHIPS:
 *    - Companies have country of registration/incorporation
 *    - Separate hqCountryId for headquarters location (can differ)
 *    - Important for regulatory compliance and jurisdiction
 * 
 * 5. MAIN CONTACT LINKAGE:
 *    - mainContactId links to primary contact person
 *    - Quick access to key relationship
 *    - Displayed in company views
 * 
 * 6. SOFT DELETE PATTERN:
 *    - isActive flag for deactivation (not hard delete)
 *    - Preserves referential integrity
 *    - Historical records remain queryable
 * 
 * SEARCH SCOPE:
 * Multi-field search includes name, type, website, country, AND assigned tags
 * This enables finding companies by any attribute or classification
 */
export default function Companies() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Filter and display state
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || 'active');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'active') params.set('status', statusFilter);
    if (viewMode !== 'list') params.set('view', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, statusFilter, viewMode]);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['companySystemTagAssignments'],
    queryFn: () => base44.entities.CompanySystemTagAssignment.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const getMainContact = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    return contacts.find(c => c.id === company?.mainContactId);
  };

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const getCountryName = (companyId) => {
    const company = companies.find(c => c.id === companyId);
    const country = countries.find(c => c.id === (company?.countryId || company?.hqCountryId));
    return country?.nameEn || '';
  };

  const getCompanyTags = (companyId) => {
    const assignments = tagAssignments.filter(a => a.companyId === companyId);
    return assignments.map(a => tags.find(t => t.id === a.systemTagId)).filter(Boolean);
  };

  const deleteMutation = useMutation({
    mutationFn: (company) => base44.entities.Company.update(company.id, { ...company, isActive: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Company deactivated');
      setDeleteDialogOpen(false);
      setCompanyToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to deactivate company: ' + error.message);
    }
  });

  const handleDeleteClick = (company, e) => {
    e.preventDefault();
    e.stopPropagation();
    setCompanyToDelete(company);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (companyToDelete) {
      deleteMutation.mutate(companyToDelete);
    }
  };

  const filteredCompanies = companies
    .filter(c => {
      const countryName = getCountryName(c.id);
      const companyTags = getCompanyTags(c.id);
      const tagNames = companyTags.map(t => t.name?.toLowerCase()).join(' ');
      const matchesSearch = (
        c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.website?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        countryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tagNames.includes(searchQuery.toLowerCase())
      );
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && c.isActive !== false) ||
        (statusFilter === 'inactive' && c.isActive === false);
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const typeColors = {
    'Operator': 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    'Owner': 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    'Authority': 'bg-red-500/10 text-red-600 border-red-500/30',
    'Agent': 'bg-green-500/10 text-green-600 border-green-500/30',
    'Service Provider': 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    'Other': 'bg-gray-500/10 text-gray-600 border-gray-500/30'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Companies</h1>
            <p className="text-gray-600 mt-1">Manage company directory</p>
          </div>
          <Link to={createPageUrl('AddCompany')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Company
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search companies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 bg-white border-gray-300 text-gray-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 bg-white border-gray-300">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="all">All</SelectItem>
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
            ) : filteredCompanies.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No companies found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Company Name</TableHead>
                    <TableHead className="text-gray-600">Primary Role</TableHead>
                    <TableHead className="text-gray-600">Country</TableHead>
                    <TableHead className="text-gray-600">Website</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Updated</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.map((company) => {
                    const country = countries.find(c => c.id === (company.countryId || company.hqCountryId));
                    const companyTags = getCompanyTags(company.id);
                    return (
                      <TableRow key={company.id} className="border-gray-200">
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">{company.name}</div>
                            {companyTags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {companyTags.map(tag => (
                                  <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company.type && (
                            <Badge className={`${typeColors[company.type]} border`}>
                              {company.type === 'Other' ? 'Other / Unclassified' : company.type}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700">{country?.nameEn || '-'}</TableCell>
                        <TableCell>
                          {company.website && (
                            <a 
                              href={company.website} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 text-cyan-600 hover:text-cyan-700 text-sm"
                            >
                              <Globe className="w-3 h-3" />
                              Link
                            </a>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={company.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                          }>
                            {company.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-600 text-sm">
                          {company.updated_date ? new Date(company.updated_date).toLocaleDateString() : '-'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <UserTagManager 
                              entityType="company" 
                              entityId={company.id}
                              entityPublicId={company.publicId}
                            />
                            <Link to={createPageUrl(`CompanyDetail?id=${company.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`EditCompany?id=${company.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={(e) => handleDeleteClick(company, e)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            </div>
                            </TableCell>
                            </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {viewMode === 'grid' && (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCompanies.map((company) => {
            const country = countries.find(c => c.id === (company.countryId || company.hqCountryId));
            const companyTags = getCompanyTags(company.id);
            return (
              <Link key={company.id} to={createPageUrl(`CompanyDetail?id=${company.id}`)}>
                <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                        <Building2 className="w-6 h-6 text-cyan-400" />
                      </div>
                      <Badge className={company.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                      }>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      {company.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                      {company.type && (
                        <Badge className={`${typeColors[company.type]} border`}>
                          {company.type === 'Other' ? 'Other / Unclassified' : company.type}
                        </Badge>
                      )}
                    </div>
                    {companyTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {companyTags.map(tag => (
                          <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                            {tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {country && (
                      <p className="text-sm text-gray-600">{country.nameEn}</p>
                    )}
                  </CardContent>
                  <div className="px-5 pb-4 flex gap-2">
                    <Link to={createPageUrl(`CompanyDetail?id=${company.id}`)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link to={createPageUrl(`EditCompany?id=${company.id}`)} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(company, e)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {viewMode === 'compact' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="space-y-2">
              {filteredCompanies.map((company) => {
                const country = countries.find(c => c.id === (company.countryId || company.hqCountryId));
                const companyTags = getCompanyTags(company.id);
                return (
                  <Link key={company.id} to={createPageUrl(`CompanyDetail?id=${company.id}`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                          <Building2 className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">{company.name}</p>
                            {companyTags.length > 0 && (
                              <div className="flex gap-1">
                                {companyTags.slice(0, 2).map(tag => (
                                  <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                                {companyTags.length > 2 && (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-300 border text-xs">
                                    +{companyTags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{country?.nameEn || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {company.type && (
                          <Badge className={`${typeColors[company.type]} border text-xs`}>
                            {company.type === 'Other' ? 'Other / Unclassified' : company.type}
                          </Badge>
                        )}
                        <Badge className={`${company.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                          {company.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-red-500 hover:text-red-700"
                          onClick={(e) => handleDeleteClick(company, e)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate "{companyToDelete?.name}"? The company will be hidden from lists but can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}