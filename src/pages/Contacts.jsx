/**
 * Contacts List Page (CRM Module)
 * 
 * PURPOSE:
 * Comprehensive contact management for individuals and group emails across
 * the maritime operations network. Supports both person contacts and distribution lists.
 * 
 * DUAL CONTACT TYPES:
 * 
 * 1. PERSON CONTACTS:
 *    - Individual people with firstName, lastName
 *    - Associated with a single company
 *    - Have direct phone/email
 *    - Standard contact card format
 * 
 * 2. GROUP EMAIL CONTACTS:
 *    - Distribution lists (e.g., "Terminal Operations Team")
 *    - Flagged with isGroupEmail = true
 *    - Use groupName instead of firstName/lastName
 *    - Represent functional roles rather than individuals
 *    - Examples: "ops@terminal.com", "security@port.com"
 * 
 * KEY FEATURES:
 * 
 * 1. DUAL TAG SYSTEM:
 *    - SYSTEM TAGS: Global, admin-managed categories (Security, Safety, etc.)
 *      * Visible to all users
 *      * Machine-readable classifications
 *      * Example: Tag security contacts for emergency notifications
 *    
 *    - USER TAGS: Personal, user-specific labels
 *      * Private to each user
 *      * Individual workflow organization
 *      * Example: "My Favorites", "Weekly Call", "Follow Up"
 * 
 * 2. CRITICAL ROLE INDICATORS:
 *    - Security and Safety roles highlighted with special badges/colors
 *    - Visual prominence for emergency contacts
 *    - Red badge for Security, Amber for Safety
 *    - Critical for operational safety protocols
 * 
 * 3. COMPANY LINKAGE:
 *    - Each contact belongs to one company (companyId)
 *    - Company name displayed for context
 *    - Enables filtering by organization
 *    - Maintains organizational structure
 * 
 * 4. SMART SORTING (lines 233-243):
 *    - Group emails sorted separately (appear at bottom)
 *    - Person contacts sorted by lastName, then firstName
 *    - Rationale: Person contacts more frequently accessed
 * 
 * 5. HARD DELETE ALLOWED:
 *    - Unlike Companies/Terminals, Contacts support permanent deletion
 *    - Rationale: People change roles frequently, historical contact info less critical
 *    - No complex dependencies to preserve
 * 
 * DISPLAY NAME LOGIC (lines 203-207):
 * - Person: "FirstName LastName" (or firstName + lastName fields)
 * - Group: groupName (or fullName as fallback)
 * - Handles legacy fullName field for backward compatibility
 * 
 * SEARCH SCOPE (lines 209-232):
 * Searches across: name fields, email, phone, company name, country, and both tag systems
 * Comprehensive search enables finding contacts by any attribute or classification
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Mail, Plus, Search, Eye, Edit, Trash2, Building2, Phone, Shield, AlertTriangle, Tag as TagIcon, Grid3x3, List, LayoutList, X, ArrowLeft } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/**
 * Contacts List Page (CRM Module)
 * 
 * PURPOSE:
 * Comprehensive contact management for individuals and group emails across
 * the maritime operations network. Supports both person contacts and distribution lists.
 * 
 * DUAL CONTACT TYPES:
 * 
 * 1. PERSON CONTACTS:
 *    - Individual people with firstName, lastName
 *    - Associated with a single company
 *    - Have direct phone/email
 *    - Standard contact card format
 * 
 * 2. GROUP EMAIL CONTACTS:
 *    - Distribution lists (e.g., "Terminal Operations Team")
 *    - Flagged with isGroupEmail = true
 *    - Use groupName instead of firstName/lastName
 *    - Represent functional roles rather than individuals
 *    - Examples: "ops@terminal.com", "security@port.com"
 * 
 * KEY FEATURES:
 * 
 * 1. DUAL TAG SYSTEM:
 *    - SYSTEM TAGS: Global, admin-managed categories (Security, Safety, etc.)
 *      * Visible to all users
 *      * Machine-readable classifications
 *      * Example: Tag security contacts for emergency notifications
 *    
 *    - USER TAGS: Personal, user-specific labels
 *      * Private to each user
 *      * Individual workflow organization
 *      * Example: "My Favorites", "Weekly Call", "Follow Up"
 * 
 * 2. CRITICAL ROLE INDICATORS:
 *    - Security and Safety roles highlighted with special badges/colors
 *    - Visual prominence for emergency contacts
 *    - Red badge for Security, Amber for Safety
 *    - Critical for operational safety protocols
 * 
 * 3. COMPANY LINKAGE:
 *    - Each contact belongs to one company (companyId)
 *    - Company name displayed for context
 *    - Enables filtering by organization
 *    - Maintains organizational structure
 * 
 * 4. SMART SORTING:
 *    - Group emails sorted separately (appear at bottom)
 *    - Person contacts sorted by lastName, then firstName
 *    - Rationale: Person contacts more frequently accessed
 * 
 * 5. HARD DELETE ALLOWED:
 *    - Unlike Companies/Terminals, Contacts support permanent deletion
 *    - Rationale: People change roles frequently, historical contact info less critical
 *    - No complex dependencies to preserve
 * 
 * DISPLAY NAME LOGIC:
 * - Person: "FirstName LastName" (or firstName + lastName fields)
 * - Group: groupName (or fullName as fallback)
 * - Handles legacy fullName field for backward compatibility
 * 
 * SEARCH SCOPE:
 * Searches across: name fields, email, phone, company name, country, and both tag systems
 */
export default function Contacts() {
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  
  // Filter and display state
  const [searchQuery, setSearchQuery] = useState(urlParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(urlParams.get('status') || 'active');
  const [viewMode, setViewMode] = useState(urlParams.get('view') || 'list');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (statusFilter !== 'active') params.set('status', statusFilter);
    if (viewMode !== 'list') params.set('view', viewMode);
    
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.replaceState({}, '', newUrl);
  }, [searchQuery, statusFilter, viewMode]);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['contactSystemTagAssignments'],
    queryFn: () => base44.entities.SystemTagAssignment.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: userTagAssignments = [] } = useQuery({
    queryKey: ['userContactTagAssignments'],
    queryFn: () => base44.entities.UserContactTagAssignment.list()
  });

  const { data: userTags = [] } = useQuery({
    queryKey: ['userTags'],
    queryFn: () => base44.entities.UserTag.list()
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Contact.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact deleted');
      setDeleteDialogOpen(false);
      setContactToDelete(null);
    },
    onError: (error) => {
      toast.error('Failed to delete contact: ' + error.message);
    }
  });

  const handleDeleteClick = (contact, e) => {
    e.preventDefault();
    e.stopPropagation();
    setContactToDelete(contact);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (contactToDelete) {
      deleteMutation.mutate(contactToDelete.id);
    }
  };

  const getCompanyById = (id) => companies.find(c => c.id === id);
  const getCountryById = (id) => countries.find(c => c.id === id);
  const getContactTags = (contactId) => {
    const assignments = tagAssignments.filter(a => a.contactId === contactId);
    return assignments.map(a => tags.find(t => t.id === a.systemTagId)).filter(Boolean);
  };
  const getContactUserTags = (contactId) => {
    const assignments = userTagAssignments.filter(a => a.contactId === contactId);
    return assignments.map(a => userTags.find(t => t.id === a.userTagId)).filter(Boolean);
  };
  
  const getDisplayName = (contact) => {
    if (contact.isGroupEmail) return contact.groupName || contact.fullName;
    const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
    return name || contact.fullName;
  };

  const filteredContacts = contacts.filter(c => {
    const company = getCompanyById(c.companyId);
    const country = getCountryById(c.countryId);
    const displayName = getDisplayName(c);
    const contactSystemTags = getContactTags(c.id);
    const contactUserTags = getContactUserTags(c.id);
    
    const matchesSearch = (
      displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.groupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneMobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country?.nameEn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contactSystemTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      contactUserTags.some(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && c.isActive !== false) ||
      (statusFilter === 'inactive' && c.isActive === false);
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    if (a.isGroupEmail && !b.isGroupEmail) return 1;
    if (!a.isGroupEmail && b.isGroupEmail) return -1;
    if (a.isGroupEmail && b.isGroupEmail) {
      return (a.groupName || '').localeCompare(b.groupName || '');
    }
    const aLast = a.lastName || '';
    const bLast = b.lastName || '';
    if (aLast !== bLast) return aLast.localeCompare(bLast);
    return (a.firstName || '').localeCompare(b.firstName || '');
  });

  const criticalRoleConfig = {
    Security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    Safety: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
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
            <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
            <p className="text-gray-600 mt-1">Manage contact directory</p>
          </div>
          <Link to={createPageUrl('AddContact')}>
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Contact
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
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
        <TooltipProvider>
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('list')}
                  className={viewMode === 'list' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <List className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>List View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <Grid3x3 className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Grid View</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setViewMode('compact')}
                  className={viewMode === 'compact' ? 'bg-cyan-600 text-white' : 'border-gray-300 text-gray-700'}
                >
                  <LayoutList className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compact View</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>

      {viewMode === 'list' && (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No contacts found</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-200">
                    <TableHead className="text-gray-600">Name</TableHead>
                    <TableHead className="text-gray-600">Company</TableHead>
                    <TableHead className="text-gray-600">Country</TableHead>
                    <TableHead className="text-gray-600">Email</TableHead>
                    <TableHead className="text-gray-600">Mobile</TableHead>
                    <TableHead className="text-gray-600">Type</TableHead>
                    <TableHead className="text-gray-600">Status</TableHead>
                    <TableHead className="text-gray-600">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.map((contact) => {
                    const company = getCompanyById(contact.companyId);
                    const country = getCountryById(contact.countryId);
                    const displayName = getDisplayName(contact);
                    
                    return (
                      <TableRow key={contact.id} className="border-gray-200">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{displayName}</span>
                            {contact.isGroupEmail && (
                              <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                                Group
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {company && (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Building2 className="w-3 h-3 text-gray-500" />
                              {company.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-700">{country?.nameEn || '-'}</TableCell>
                        <TableCell>
                          {contact.email && (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Mail className="w-3 h-3 text-gray-500" />
                              {contact.email}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.phoneMobile && (
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Phone className="w-3 h-3 text-gray-500" />
                              {contact.phoneMobile}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {contact.isGroupEmail ? (
                            <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border">
                              <Mail className="w-3 h-3 mr-1" />
                              Group Email
                            </Badge>
                          ) : (
                            <span className="text-gray-700 text-sm">Person</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={contact.isActive 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                            : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                          }>
                            {contact.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <UserTagManager 
                              entityType="contact" 
                              entityId={contact.id}
                              entityPublicId={contact.publicId}
                            />
                            <Link to={createPageUrl(`ContactDetail?id=${contact.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Link to={createPageUrl(`EditContact?id=${contact.id}`)}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Edit className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-red-500 hover:text-red-700"
                              onClick={(e) => handleDeleteClick(contact, e)}
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
          {filteredContacts.map((contact) => {
            const company = getCompanyById(contact.companyId);
            const country = getCountryById(contact.countryId);
            const displayName = getDisplayName(contact);
            const contactTags = getContactTags(contact.id);
            return (
              <Link key={contact.id} to={createPageUrl(`ContactDetail?id=${contact.id}`)}>
                <Card className="bg-white border-gray-200 hover:border-cyan-500/50 hover:shadow-lg transition-all group cursor-pointer h-full">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                        <Mail className="w-6 h-6 text-cyan-400" />
                      </div>
                      <Badge className={contact.isActive 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                        : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
                      }>
                        {contact.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-cyan-600 transition-colors">
                      {displayName}
                    </h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {contact.isGroupEmail && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                          Group Email
                        </Badge>
                      )}
                      {contactTags.map(tag => (
                        <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                          {tag.name}
                        </Badge>
                      ))}
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      {company && <p>{company.name}</p>}
                      {country && <p>{country.nameEn}</p>}
                      {contact.email && <p className="truncate">{contact.email}</p>}
                    </div>
                  </CardContent>
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
              {filteredContacts.map((contact) => {
                const company = getCompanyById(contact.companyId);
                const displayName = getDisplayName(contact);
                const contactTags = getContactTags(contact.id);
                return (
                  <Link key={contact.id} to={createPageUrl(`ContactDetail?id=${contact.id}`)}>
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30">
                          <Mail className="w-4 h-4 text-cyan-400" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-gray-900 text-sm group-hover:text-cyan-600 transition-colors">
                              {displayName}
                            </p>
                            {contactTags.length > 0 && (
                              <div className="flex gap-1">
                                {contactTags.slice(0, 2).map(tag => (
                                  <Badge key={tag.id} className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                                    {tag.name}
                                  </Badge>
                                ))}
                                {contactTags.length > 2 && (
                                  <Badge className="bg-gray-100 text-gray-600 border-gray-300 border text-xs">
                                    +{contactTags.length - 2}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{company?.name || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {contact.isGroupEmail && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                            Group
                          </Badge>
                        )}
                        <Badge className={`${contact.isActive 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border text-xs`}>
                          {contact.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}