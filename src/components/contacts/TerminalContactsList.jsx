/**
 * Terminal Contacts List Component (Contact Management Widget)
 * 
 * PURPOSE:
 * Reusable contacts table for terminal detail page.
 * Shows contacts linked to terminal with tagging and favorites.
 * 
 * PROP:
 * - terminalId: Filter contacts to this terminal
 * 
 * USED IN:
 * TerminalDetail page, Contacts tab.
 * 
 * CONTACTS QUERY (lines 28-31):
 * Filters by terminalId.
 * Shows only relevant contacts.
 * 
 * MULTIPLE SUPPORTING QUERIES:
 * - Companies (for employer info)
 * - Tag assignments (for tag display)
 * - Tags (for tag metadata)
 * - Current user (for favorites)
 * - User favorites (for favorite status)
 * 
 * COMPREHENSIVE DATA:
 * Enriches contact display with related data.
 * 
 * FAVORITE TOGGLE (lines 59-81, 178-183):
 * 
 * Star icon button (line 182).
 * 
 * FILLED STAR:
 * Contact is favorited (amber color).
 * 
 * EMPTY STAR:
 * Not favorited (gray).
 * 
 * TOGGLE LOGIC (lines 59-81):
 * 
 * IF FAVORITED:
 * Find existing UserFavoriteContact.
 * Delete it.
 * 
 * IF NOT:
 * Create UserFavoriteContact record.
 * 
 * SCOPED TO TERMINAL (line 61, 72):
 * Favorite is terminal-specific.
 * Same contact favorited separately per terminal.
 * 
 * RATIONALE:
 * Contact may work at multiple terminals.
 * User favorites them only where relevant.
 * 
 * MAIN CONTACT DESIGNATION (lines 83-95, 188-193, 270-283):
 * 
 * MAIN CONTACT BADGE (lines 188-193):
 * Cyan badge with Award icon.
 * Shows "Main" label.
 * 
 * SET MAIN BUTTON (lines 270-283):
 * Award icon button in actions column.
 * 
 * LOGIC (lines 83-95):
 * Updates Company.mainContactId.
 * Sets this contact as primary contact for company.
 * 
 * USE CASE:
 * Company has 5 contacts.
 * One is primary/main contact.
 * Quick identification.
 * 
 * CRITICAL ROLE INDICATORS (lines 118-121, 221-227):
 * 
 * SECURITY ROLE:
 * Red shield icon, red background.
 * High importance (security officer).
 * 
 * SAFETY ROLE:
 * Amber alert triangle, amber background.
 * Critical contact (safety manager).
 * 
 * NONE:
 * No badge shown (regular contact).
 * 
 * VISUAL PRIORITY:
 * Critical contacts stand out.
 * Quick identification in emergencies.
 * 
 * TAG DISPLAY (lines 229-248):
 * 
 * Shows up to 2 tags inline.
 * 
 * TAG TYPES:
 * - System tags: Purple (line 234-236)
 * - User tags: Gray (line 236-237)
 * 
 * TAG OVERFLOW (lines 243-247):
 * If more than 2 tags: "+N" badge.
 * Prevents row overflow.
 * 
 * SEARCH SCOPE (lines 108-116):
 * Searches:
 * - Contact name
 * - Email
 * - Mobile phone
 * - Company name
 * 
 * Comprehensive contact finding.
 * 
 * TABLE COLUMNS:
 * 
 * 1. FAVORITE (line 157, 177-184): Star toggle
 * 2. NAME (line 158, 185-195): With Main badge
 * 3. COMPANY (line 159, 196-203): With building icon
 * 4. JOB TITLE (line 160, 204): Position
 * 5. EMAIL (line 161, 205-211): With mail icon
 * 6. MOBILE (line 162, 213-219): With phone icon
 * 7. CRITICAL ROLE (line 163, 221-228): Security/Safety badges
 * 8. TAGS (line 164, 229-249): System/user tags
 * 9. STATUS (line 165, 250-257): Active/Inactive
 * 10. ACTIONS (line 166, 258-285): View/Edit/Set Main
 * 
 * COMPACT LAYOUT:
 * Icons save horizontal space.
 * Many columns fit on screen.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../../utils';
import { 
  Plus, Search, Star, Shield, AlertTriangle, Eye, Edit, 
  Award, Mail, Phone, Building2, Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function TerminalContactsList({ terminalId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts', terminalId],
    queryFn: () => base44.entities.Contact.filter({ terminalId })
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['contactTagAssignments'],
    queryFn: () => base44.entities.ContactTagAssignment.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['contactTags'],
    queryFn: () => base44.entities.ContactTag.list()
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['userFavoriteContacts', user?.id],
    queryFn: () => base44.entities.UserFavoriteContact.filter({ userId: user.id }),
    enabled: !!user
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (contactId) => {
      const existing = favorites.find(f => f.contactId === contactId && f.terminalId === terminalId);
      if (existing) {
        await base44.entities.UserFavoriteContact.delete(existing.id);
      } else {
        await base44.entities.UserFavoriteContact.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          userId: user.id,
          userPublicId: user.publicId || user.id,
          contactId,
          contactPublicId: contacts.find(c => c.id === contactId)?.publicId,
          terminalId,
          terminalPublicId: terminalId
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['userFavoriteContacts']);
      toast.success('Favorite updated');
    }
  });

  const setMainContactMutation = useMutation({
    mutationFn: async ({ contactId, companyId }) => {
      const contact = contacts.find(c => c.id === contactId);
      await base44.entities.Company.update(companyId, {
        mainContactId: contactId,
        mainContactPublicId: contact.publicId
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      toast.success('Main contact updated');
    }
  });

  const getCompanyById = (id) => companies.find(c => c.id === id);
  const getContactTags = (contactId) => {
    const assignments = tagAssignments.filter(a => a.contactId === contactId);
    return assignments.map(a => tags.find(t => t.id === a.contactTagId)).filter(Boolean);
  };
  const isFavorite = (contactId) => favorites.some(f => f.contactId === contactId && f.terminalId === terminalId);
  const isMainContact = (contact) => {
    const company = getCompanyById(contact.companyId);
    return company?.mainContactId === contact.id;
  };

  const filteredContacts = contacts.filter(c => {
    const company = getCompanyById(c.companyId);
    return (
      c.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phoneMobile?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const criticalRoleConfig = {
    Security: { icon: Shield, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
    Safety: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/30' }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-white border-gray-300 text-gray-900"
          />
        </div>
        <Link to={createPageUrl(`AddContact?terminalId=${terminalId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Plus className="w-4 h-4 mr-2" />
            Add Contact
          </Button>
        </Link>
      </div>

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
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead className="text-gray-600 w-8"></TableHead>
                <TableHead className="text-gray-600">Name</TableHead>
                <TableHead className="text-gray-600">Company</TableHead>
                <TableHead className="text-gray-600">Job Title</TableHead>
                <TableHead className="text-gray-600">Email</TableHead>
                <TableHead className="text-gray-600">Mobile</TableHead>
                <TableHead className="text-gray-600">Critical Role</TableHead>
                <TableHead className="text-gray-600">Tags</TableHead>
                <TableHead className="text-gray-600">Status</TableHead>
                <TableHead className="text-gray-600">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContacts.map((contact) => {
                const company = getCompanyById(contact.companyId);
                const contactTags = getContactTags(contact.id);
                const roleConfig = contact.criticalRole !== 'None' ? criticalRoleConfig[contact.criticalRole] : null;
                
                return (
                  <TableRow key={contact.id} className="border-gray-200">
                    <TableCell>
                      <button
                        onClick={() => toggleFavoriteMutation.mutate(contact.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Star className={`w-4 h-4 ${isFavorite(contact.id) ? 'fill-amber-500 text-amber-500' : 'text-gray-400'}`} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{contact.fullName}</span>
                        {isMainContact(contact) && (
                          <Badge className="bg-cyan-500/10 text-cyan-600 border-cyan-500/30 border">
                            <Award className="w-3 h-3 mr-1" />
                            Main
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
                    <TableCell className="text-gray-700">{contact.jobTitle || '-'}</TableCell>
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
                      {roleConfig && (
                        <Badge className={`${roleConfig.bg} ${roleConfig.color} border ${roleConfig.border}`}>
                          <roleConfig.icon className="w-3 h-3 mr-1" />
                          {contact.criticalRole}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {contactTags.slice(0, 2).map(tag => (
                          <Badge 
                            key={tag.id}
                            className={tag.isSystem 
                              ? 'bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs'
                              : 'bg-gray-100 text-gray-700 border-gray-300 border text-xs'
                            }
                          >
                            <Tag className="w-2.5 h-2.5 mr-1" />
                            {tag.name}
                          </Badge>
                        ))}
                        {contactTags.length > 2 && (
                          <Badge className="bg-gray-100 text-gray-600 text-xs">
                            +{contactTags.length - 2}
                          </Badge>
                        )}
                      </div>
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
                        {contact.companyId && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setMainContactMutation.mutate({ 
                              contactId: contact.id, 
                              companyId: contact.companyId 
                            })}
                            title="Set as main contact"
                          >
                            <Award className="w-4 h-4 text-cyan-600" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}