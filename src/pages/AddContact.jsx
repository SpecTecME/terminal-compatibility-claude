import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Save } from 'lucide-react';
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

/**
 * Add Contact Page (CRM Module)
 * 
 * PURPOSE:
 * Creates individual person OR group email contacts with dual tag system.
 * Supports rich organizational and personal information capture.
 * 
 * DUAL CONTACT TYPE ARCHITECTURE:
 * 
 * 1. PERSON CONTACTS (Default):
 *    - Individual human beings
 *    - firstName + lastName (both required)
 *    - preferredName for informal communications
 *    - Personal phone numbers, WhatsApp
 *    - Job title, department, location
 * 
 * 2. GROUP EMAIL CONTACTS:
 *    - Distribution lists, functional mailboxes
 *    - isGroupEmail = true
 *    - groupName instead of firstName/lastName
 *    - Examples: "Operations Team", "security@terminal.com"
 *    - Represents functions, not individuals
 * 
 * KEY FEATURES:
 * 
 * 1. CONTEXT-AWARE NAVIGATION:
 *    - Can be accessed from Contacts list (general)
 *    - Can be accessed from TerminalDetail with ?terminalId=x (pre-linked)
 *    - Returns to source context on save/cancel
 *    - terminalId stored in contact for relationship
 * 
 * 2. SMART COUNTRY INHERITANCE:
 *    - When company selected, auto-populates country from company.countryId
 *    - User can override if needed
 *    - UX convenience for common case (contact in company's country)
 * 
 * 3. WHATSAPP CONVENIENCE:
 *    - "Copy to WhatsApp" checkbox
 *    - Auto-copies phoneMobile to whatsapp field
 *    - Common pattern: WhatsApp number = mobile number
 *    - Saves redundant data entry
 * 
 * 4. CRITICAL ROLE FLAGGING:
 *    - Security / Safety / None designation
 *    - High-priority contacts for emergency situations
 *    - Affects UI highlighting and notification routing
 *    - Example: Security contact gets priority in incident response
 * 
 * 5. DUAL TAG SYSTEM (Same as Companies):
 *    - System Tags: Global, admin-managed (Security, Operations, etc.)
 *    - User Tags: Personal, user-specific organization
 *    - Both can be assigned during creation
 *    - Inline user tag creation supported
 * 
 * 6. CULTURAL SENSITIVITY FIELDS (Advanced):
 *    - dateOfBirth (for celebrations, age-appropriate assignments)
 *    - religionOrObservance (for scheduling respect)
 *    - observanceNotes (specific requirements)
 *    - NOT shown in snippet but part of full schema
 *    - Supports diverse, global workforce
 * 
 * VALIDATION RULES:
 * - Person contacts: firstName AND lastName required
 * - Group contacts: groupName required
 * - Email format validated by input type
 * - Phone formats NOT validated (international variety)
 */
export default function AddContact() {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Optional pre-link to specific terminal (when adding from TerminalDetail)
  const terminalId = urlParams.get('terminalId');
  
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
    terminalId: terminalId || '',
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

  const { data: userTags = [] } = useQuery({
    queryKey: ['userTags'],
    queryFn: () => base44.entities.UserTag.list()
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.error('Failed to load user:', e);
      }
    };
    loadUser();
  }, []);

  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedUserTags, setSelectedUserTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');
  const [copyToWhatsApp, setCopyToWhatsApp] = useState(false);

  /**
   * Auto-populate contact's country from selected company
   * 
   * UX RATIONALE:
   * Most contacts work in their company's registered country.
   * Auto-filling saves time for the common case.
   * User can still manually override if contact is in different country.
   * 
   * TRIGGERS:
   * - When company selected
   * - When companies data loads
   */
  useEffect(() => {
    if (formData.companyId && companies.length > 0) {
      const company = companies.find(c => c.id === formData.companyId);
      if (company && company.countryId) {
        setFormData(prev => ({ ...prev, countryId: company.countryId }));
      }
    }
  }, [formData.companyId, companies]);

  /**
   * Auto-copy mobile number to WhatsApp field
   * 
   * UX CONVENIENCE:
   * WhatsApp number is almost always the same as mobile number.
   * When checkbox enabled, keep them synchronized.
   * Reduces redundant data entry.
   */
  useEffect(() => {
    if (copyToWhatsApp && formData.phoneMobile) {
      setFormData(prev => ({ ...prev, whatsapp: prev.phoneMobile }));
    }
  }, [copyToWhatsApp, formData.phoneMobile]);

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const contact = await base44.entities.Contact.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        companyPublicId: companies.find(c => c.id === data.companyId)?.publicId,
        countryPublicId: countries.find(c => c.id === data.countryId)?.publicId,
        terminalPublicId: terminals.find(t => t.id === data.terminalId)?.publicId
      });

      // Create system tag assignments
      if (selectedTags.length > 0) {
        const assignments = selectedTags.map(tagId => ({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          contactId: contact.id,
          contactPublicId: contact.publicId,
          systemTagId: tagId,
          systemTagPublicId: tags.find(t => t.id === tagId)?.publicId
        }));
        await base44.entities.SystemTagAssignment.bulkCreate(assignments);
      }

      // Create user tag assignments
      if (selectedUserTags.length > 0) {
        const userTagAssignments = selectedUserTags.map(tagId => {
          const tag = userTags.find(t => t.id === tagId);
          return {
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            userId: user.id,
            userPublicId: user.publicId || crypto.randomUUID(),
            contactId: contact.id,
            contactPublicId: contact.publicId,
            userTagId: tagId,
            userTagPublicId: tag?.publicId || crypto.randomUUID()
          };
        });
        await base44.entities.UserContactTagAssignment.bulkCreate(userTagAssignments);
      }

      return contact;
    },
    onSuccess: (contact) => {
      queryClient.invalidateQueries(['contacts']);
      toast.success('Contact created successfully');
      if (terminalId) {
        navigate(createPageUrl(`TerminalDetail?id=${terminalId}`));
      } else {
        navigate(createPageUrl('Contacts'));
      }
    },
    onError: (error) => {
      toast.error('Failed to create contact: ' + error.message);
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
    createMutation.mutate(formData);
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim() || !user) return;
    
    const exists = userTags.some(t => t.name.toLowerCase() === newTagName.toLowerCase() && t.userId === user.id);
    if (exists) {
      toast.error('Tag already exists');
      return;
    }

    try {
      const newTag = await base44.entities.UserTag.create({
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        userId: user.id,
        userPublicId: user.publicId || crypto.randomUUID(),
        name: newTagName.trim()
      });
      
      queryClient.invalidateQueries(['userTags']);
      setSelectedUserTags([...selectedUserTags, newTag.id]);
      setNewTagName('');
      toast.success('Tag created and selected');
    } catch (error) {
      toast.error('Failed to create tag: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl(terminalId ? `TerminalDetail?id=${terminalId}` : 'Contacts')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Contact</h1>
          <p className="text-gray-600 mt-1">Create a new contact record</p>
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
                <Label className="text-gray-700">My Tags</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {userTags.filter(t => user && t.userId === user.id).map(tag => (
                    <label key={tag.id} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer">
                      <Checkbox
                        checked={selectedUserTags.includes(tag.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedUserTags([...selectedUserTags, tag.id]);
                          } else {
                            setSelectedUserTags(selectedUserTags.filter(id => id !== tag.id));
                          }
                        }}
                      />
                      <span className="text-sm text-gray-700">{tag.name}</span>
                    </label>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Create new tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())}
                    className="bg-white border-gray-300 text-gray-900 text-sm h-9"
                  />
                  <Button 
                    type="button"
                    size="sm" 
                    onClick={handleAddNewTag}
                    disabled={!newTagName.trim()}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 h-9"
                  >
                    Add Tag
                  </Button>
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
            <Link to={createPageUrl(terminalId ? `TerminalDetail?id=${terminalId}` : 'Contacts')}>
              <Button type="button" variant="outline" className="border-gray-300">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit"
              disabled={createMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              <Save className="w-4 h-4 mr-2" />
              {createMutation.isPending ? 'Creating...' : 'Create Contact'}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}