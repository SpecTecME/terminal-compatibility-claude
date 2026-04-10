/**
 * Edit Contact Page
 * 
 * PURPOSE:
 * Form for updating contact information supporting both individual persons and group emails.
 * Implements auto-population logic, system tag management, and WhatsApp convenience features.
 * 
 * DUAL CONTACT TYPE SUPPORT (lines 30, 105-246):
 * 
 * Form structure changes based on isGroupEmail checkbox:
 * 
 * INDIVIDUAL MODE (isGroupEmail = false):
 * - Shows firstName, lastName, preferredName fields
 * - Personal contact methods (mobile, WhatsApp)
 * - Validation requires firstName AND lastName
 * 
 * GROUP MODE (isGroupEmail = true):
 * - Shows ONLY groupName field
 * - Hides personal name fields
 * - Validation requires groupName only
 * 
 * Conditional Rendering (lines 257-298):
 * {formData.isGroupEmail ? <GroupFields /> : <PersonFields />}
 * 
 * PREVENTS:
 * - Mixing group and personal data
 * - Invalid data combinations
 * - UI confusion
 * 
 * AUTO-POPULATION LOGIC:
 * 
 * COMPANY → COUNTRY (lines 136-143):
 * When company selected AND contact is NEW (not editing existing):
 * - Read selected company's countryId
 * - Auto-populate contact's countryId
 * - User can override if needed
 * 
 * RATIONALE:
 * Most contacts work in company's home country.
 * Reduces data entry friction.
 * Common pattern across CRM systems.
 * 
 * CONDITION: !contact
 * Only applies to NEW contacts in AddContact.
 * When EDITING, preserves contact's own country (doesn't override).
 * 
 * MOBILE → WHATSAPP COPY (lines 55, 145-149, 386-397):
 * 
 * copyToWhatsApp checkbox convenience feature:
 * - When checked, mobile phone number copied to WhatsApp field
 * - Real-time sync via useEffect
 * - Common case: WhatsApp = mobile number
 * 
 * WORKFLOW:
 * 1. User enters mobile: "+971 50 123 4567"
 * 2. User checks "Copy to WhatsApp"
 * 3. WhatsApp field auto-fills: "+971 50 123 4567"
 * 4. User can still edit WhatsApp independently if needed
 * 
 * Saves time for 90% case while allowing exceptions.
 * 
 * SYSTEM TAG MANAGEMENT (lines 56, 99-103, 132, 151-181):
 * 
 * Parallel to EditCompany tag management:
 * - Load existing SystemTagAssignment records
 * - Initialize selectedTags state
 * - Track checkbox changes
 * - Compute delta on save (toAdd, toRemove)
 * - Delete/create assignments
 * 
 * TAG FILTERING (lines 445):
 * Only shows tags where appliesTo includes 'Contact'.
 * Prevents assigning company-only or terminal-only tags to contacts.
 * 
 * Schema-driven UI: tag.appliesTo array controls visibility.
 * 
 * DUAL REFERENCE PATTERN (lines 155-172):
 * 
 * Updates use both internal IDs and publicIds:
 * - companyId + companyPublicId
 * - countryId + countryPublicId
 * - terminalId + terminalPublicId
 * - systemTagId + systemTagPublicId
 * 
 * MIGRATION SUPPORT:
 * publicIds are UUIDs (portable across environments).
 * Internal IDs are Base44 database IDs (environment-specific).
 * Storing both enables:
 * - Fast queries (internal IDs)
 * - Data export/import (publicIds)
 * - Environment migrations
 * 
 * FORM VALIDATION (lines 195-208):
 * 
 * Conditional validation based on contact type:
 * - Group email: Requires groupName
 * - Individual: Requires firstName AND lastName
 * 
 * Clear error messages guide user.
 * Prevents incomplete records.
 * 
 * CRITICAL ROLE SELECTION (lines 462-474):
 * 
 * Dropdown for Security/Safety/None designation.
 * See ContactDetail comments for critical role significance.
 * Simple select interface for important classification.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Save } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

export default function EditContact() {
  const urlParams = new URLSearchParams(window.location.search);
  const contactId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    isGroupEmail: false,
    groupName: '',
    firstName: '',
    lastName: '',
    preferredName: '',
    companyId: '',
    countryId: '',
    terminalId: '',
    jobTitle: '',
    department: '',
    location: '',
    email: '',
    phoneMobile: '',
    phoneOffice: '',
    whatsapp: '',
    preferredContactMethod: '',
    timezone: '',
    criticalRole: 'None',
    dateOfBirth: '',
    religionOrObservance: '',
    observanceNotes: '',
    isActive: true,
    notes: ''
  });

  const [copyToWhatsApp, setCopyToWhatsApp] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);

  const { data: contact, isLoading } = useQuery({
    queryKey: ['contact', contactId],
    queryFn: () => base44.entities.Contact.filter({ id: contactId }).then(r => r[0]),
    enabled: !!contactId
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const { data: allCountries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const isCountryActive = (country) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    if (validFrom && validFrom > today) return false;
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const countries = allCountries.filter(c => isCountryActive(c)).sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: tagAssignments = [] } = useQuery({
    queryKey: ['systemTagAssignments', contactId],
    queryFn: () => base44.entities.SystemTagAssignment.filter({ contactId }),
    enabled: !!contactId
  });

  useEffect(() => {
    if (contact) {
      setFormData({
        isGroupEmail: contact.isGroupEmail || false,
        groupName: contact.groupName || '',
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        preferredName: contact.preferredName || '',
        companyId: contact.companyId || '',
        countryId: contact.countryId || '',
        terminalId: contact.terminalId || '',
        jobTitle: contact.jobTitle || '',
        department: contact.department || '',
        location: contact.location || '',
        email: contact.email || '',
        phoneMobile: contact.phoneMobile || '',
        phoneOffice: contact.phoneOffice || '',
        whatsapp: contact.whatsapp || '',
        preferredContactMethod: contact.preferredContactMethod || '',
        timezone: contact.timezone || '',
        criticalRole: contact.criticalRole || 'None',
        dateOfBirth: contact.dateOfBirth || '',
        religionOrObservance: contact.religionOrObservance || '',
        observanceNotes: contact.observanceNotes || '',
        isActive: contact.isActive ?? true,
        notes: contact.notes || ''
      });
      setSelectedTags(tagAssignments.map(a => a.systemTagId));
    }
  }, [contact, tagAssignments]);

  useEffect(() => {
    if (formData.companyId && companies.length > 0) {
      const company = companies.find(c => c.id === formData.companyId);
      if (company && company.countryId && !contact) {
        setFormData(prev => ({ ...prev, countryId: company.countryId }));
      }
    }
  }, [formData.companyId, companies, contact]);

  useEffect(() => {
    if (copyToWhatsApp && formData.phoneMobile) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phoneMobile }));
    }
  }, [copyToWhatsApp, formData.phoneMobile]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Contact.update(contactId, {
        ...data,
        companyPublicId: companies.find(c => c.id === data.companyId)?.publicId,
        countryPublicId: countries.find(c => c.id === data.countryId)?.publicId,
        terminalPublicId: terminals.find(t => t.id === data.terminalId)?.publicId
      });

      const existingTagIds = tagAssignments.map(a => a.systemTagId);
      const toAdd = selectedTags.filter(id => !existingTagIds.includes(id));
      const toRemove = existingTagIds.filter(id => !selectedTags.includes(id));

      if (toAdd.length > 0) {
        const assignments = toAdd.map(tagId => ({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          contactId: contactId,
          contactPublicId: contact.publicId,
          systemTagId: tagId,
          systemTagPublicId: tags.find(t => t.id === tagId)?.publicId
        }));
        await base44.entities.SystemTagAssignment.bulkCreate(assignments);
      }

      if (toRemove.length > 0) {
        const assignmentsToRemove = tagAssignments.filter(a => toRemove.includes(a.systemTagId));
        for (const assignment of assignmentsToRemove) {
          await base44.entities.SystemTagAssignment.delete(assignment.id);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['contacts']);
      queryClient.invalidateQueries(['contact', contactId]);
      queryClient.invalidateQueries(['systemTagAssignments', contactId]);
      toast.success('Contact updated successfully');
      navigate(createPageUrl(`ContactDetail?id=${contactId}`));
    },
    onError: (error) => {
      toast.error('Failed to update contact: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.isGroupEmail) {
      if (!formData.groupName) {
        toast.error('Group name is required');
        return;
      }
    } else {
      if (!formData.firstName || !formData.lastName) {
        toast.error('First name and last name are required');
        return;
      }
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Contact</h1>
          <p className="text-gray-600 mt-1">Update contact information</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Contact Type</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={formData.isGroupEmail}
                  onCheckedChange={(checked) => setFormData({...formData, isGroupEmail: checked})}
                />
                <Label className="text-gray-700">Group Email / Shared Mailbox</Label>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">
                {formData.isGroupEmail ? 'Group Information' : 'Personal Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {formData.isGroupEmail ? (
                <div className="space-y-2">
                  <Label className="text-gray-700">Group Name *</Label>
                  <Input
                    value={formData.groupName}
                    onChange={(e) => setFormData({...formData, groupName: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="e.g., Operations Team, Safety Department"
                    required
                  />
                </div>
              ) : (
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-700">First Name *</Label>
                    <Input
                      value={formData.firstName}
                      onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Last Name *</Label>
                    <Input
                      value={formData.lastName}
                      onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Preferred Name</Label>
                    <Input
                      value={formData.preferredName}
                      onChange={(e) => setFormData({...formData, preferredName: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                      placeholder="For greetings"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Organization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Company</Label>
                  <Select value={formData.companyId} onValueChange={(value) => setFormData({...formData, companyId: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {companies.map(company => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Country</Label>
                  <Select value={formData.countryId} onValueChange={(value) => setFormData({...formData, countryId: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.nameEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Job Title</Label>
                  <Input
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Department</Label>
                  <Input
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Location</Label>
                  <Input
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Mobile Phone (format: +CountryCode Number)</Label>
                  <Input
                    value={formData.phoneMobile}
                    onChange={(e) => setFormData({...formData, phoneMobile: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="+971 50 123 4567"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      checked={copyToWhatsApp}
                      onCheckedChange={setCopyToWhatsApp}
                    />
                    <Label className="text-sm text-gray-600">Copy to WhatsApp</Label>
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-gray-700">Office Phone</Label>
                  <Input
                    value={formData.phoneOffice}
                    onChange={(e) => setFormData({...formData, phoneOffice: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">WhatsApp (format: +CountryCode Number)</Label>
                  <Input
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                    placeholder="+971 50 123 4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Preferred Method</Label>
                  <Select value={formData.preferredContactMethod} onValueChange={(value) => setFormData({...formData, preferredContactMethod: value})}>
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <SelectItem value="Email">Email</SelectItem>
                      <SelectItem value="Mobile">Mobile</SelectItem>
                      <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                      <SelectItem value="Office">Office</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Tags & Critical Role</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-700">System Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.filter(t => t.isActive && t.appliesTo?.includes('Contact')).map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTags([...selectedTags, tag.id]);
                          } else {
                            setSelectedTags(selectedTags.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{tag.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Critical Role</Label>
                <Select value={formData.criticalRole} onValueChange={(value) => setFormData({...formData, criticalRole: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="None">None</SelectItem>
                    <SelectItem value="Security">Security</SelectItem>
                    <SelectItem value="Safety">Safety</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  rows={4}
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
                />
                <Label className="text-gray-700">Active</Label>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Link to={createPageUrl(`ContactDetail?id=${contactId}`)}>
              <Button type="button" variant="outline" className="border-gray-300">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit"
              disabled={updateMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}