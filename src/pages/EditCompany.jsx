/**
 * Edit Company Page
 * 
 * PURPOSE:
 * Form for updating company information with validation and tag management.
 * Handles dual country relationships (registration vs HQ location) and system tag assignments.
 * 
 * DUAL COUNTRY MODEL:
 * 
 * countryId: Country of REGISTRATION/INCORPORATION
 * - Legal jurisdiction for company
 * - Determines corporate law applicability
 * - Example: Company registered in Panama
 * 
 * hqCountryId: Country where HEADQUARTERS located
 * - Physical operations center
 * - May differ from registration country (tax optimization)
 * - Example: HQ in Singapore, registered in Panama
 * 
 * COMMON PATTERN:
 * Ship owners often register in "flag of convenience" countries
 * (Liberia, Panama, Marshall Islands) for favorable regulations,
 * but operate HQ in major maritime hubs (Singapore, London, Athens).
 * 
 * WEBSITE URL NORMALIZATION (lines 164-207):
 * 
 * PROBLEM:
 * Users enter websites in various formats:
 * - "google.com"
 * - "www.google.com"
 * - "http://google.com"
 * - "https://www.google.com"
 * 
 * SOLUTION:
 * 1. Validation (validateWebsite function):
 *    - Strip http/https and www
 *    - Check domain format (must have dot)
 *    - Prevent numeric-only domains
 *    - Example: "123.456" rejected
 * 
 * 2. Normalization (lines 200-203):
 *    - Add https:// prefix if missing
 *    - Stored in consistent format
 *    - Example: "google.com" → "https://google.com"
 * 
 * WHY IMPORTANT:
 * - Consistent storage format
 * - Prevents broken links
 * - Professional presentation
 * 
 * SYSTEM TAG MANAGEMENT (lines 53-62, 107-111, 113-151):
 * 
 * ARCHITECTURE:
 * CompanySystemTagAssignment = Many-to-many join table
 * - Links Company ↔ SystemTag
 * - Allows multiple tags per company
 * - Allows multiple companies per tag
 * 
 * WORKFLOW:
 * 1. Load existing tag assignments for this company
 * 2. Initialize selectedTags state with current assignments
 * 3. User toggles checkboxes (lines 393-408)
 * 4. On save, compute delta (toAdd, toRemove)
 * 5. Delete removed assignments, create new assignments
 * 
 * DELTA CALCULATION (lines 126-148):
 * - currentTagIds: IDs of currently assigned tags (from DB)
 * - selectedTags: IDs user has checked (from UI state)
 * - toAdd: In selectedTags but not currentTagIds (new assignments)
 * - toRemove: In currentTagIds but not selectedTags (revoked assignments)
 * 
 * EFFICIENCY:
 * Only modifies changed assignments (not full replacement).
 * Preserves assignment IDs and timestamps for unchanged tags.
 * 
 * ASSIGNMENT RECORD STRUCTURE (lines 138-145):
 * Each CompanySystemTagAssignment contains:
 * - publicId: UUID for migration portability
 * - tenantId: Multi-tenancy support
 * - companyId + companyPublicId: Dual reference to company
 * - systemTagId + systemTagPublicId: Dual reference to tag
 * 
 * Dual references support both internal IDs (fast queries) and
 * publicIds (migration/export scenarios).
 * 
 * IACS MEMBER CONDITIONAL (lines 276-290):
 * 
 * iacsMember checkbox ONLY shown when type = 'Authority'.
 * 
 * RATIONALE:
 * IACS membership only meaningful for classification societies.
 * Hiding for other types prevents confusion and data entry errors.
 * 
 * Conditional rendering pattern:
 * {formData.type === 'Authority' && <IacsCheckbox />}
 * 
 * COUNTRY ACTIVE FILTERING (lines 71-84):
 * 
 * Only shows currently valid countries in dropdowns.
 * Filters based on validFrom/validTo dates.
 * 
 * PREVENTS:
 * - Selecting historical countries (e.g., "USSR", "Yugoslavia")
 * - Selecting future effective countries (planned but not yet official)
 * 
 * Ensures data quality and regulatory compliance.
 * 
 * FORM VALIDATION (lines 185-206):
 * 
 * REQUIRED FIELDS:
 * - Company name (always required)
 * - No other mandatory fields (flexible data entry)
 * 
 * OPTIONAL VALIDATIONS:
 * - Website format if provided
 * - Shows user-friendly error messages
 * - Prevents form submission until valid
 * 
 * DEBUGGING LOGS (lines 115, 123, 130, 135, 147, 150, 187, 205):
 * Extensive console logging for troubleshooting tag assignment logic.
 * Can be removed in production or gated behind debug flag.
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from '../components/ui/SearchableSelect';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function EditCompany() {
  const urlParams = new URLSearchParams(window.location.search);
  const companyId = urlParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    legalName: '',
    type: '',
    countryId: '',
    phone: '',
    email: '',
    website: '',
    hqAddressLine1: '',
    hqCity: '',
    hqPostalCode: '',
    hqCountryId: '',
    iacsMember: false,
    notes: '',
    isActive: true
  });

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: () => base44.entities.Company.filter({ id: companyId }).then(r => r[0]),
    enabled: !!companyId
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: existingTagAssignments = [] } = useQuery({
    queryKey: ['companySystemTagAssignments', companyId],
    queryFn: () => base44.entities.CompanySystemTagAssignment.filter({ companyId }),
    enabled: !!companyId
  });

  const [selectedTags, setSelectedTags] = React.useState([]);

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

  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        legalName: company.legalName || '',
        type: company.type || '',
        countryId: company.countryId || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        hqAddressLine1: company.hqAddressLine1 || '',
        hqCity: company.hqCity || '',
        hqPostalCode: company.hqPostalCode || '',
        hqCountryId: company.hqCountryId || '',
        iacsMember: company.iacsMember || false,
        notes: company.notes || '',
        isActive: company.isActive ?? true
      });
    }
  }, [company]);

  useEffect(() => {
    if (existingTagAssignments.length > 0) {
      setSelectedTags(existingTagAssignments.map(a => a.systemTagId));
    }
  }, [existingTagAssignments]);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      console.log('Mutation started', { data, selectedTags, existingTagAssignments, company, tags });
      
      const country = countries.find(c => c.id === data.countryId);
      await base44.entities.Company.update(companyId, {
        ...data,
        countryPublicId: country?.publicId || crypto.randomUUID()
      });
      
      console.log('Company updated, now handling tags');

      // Update tag assignments
      const currentTagIds = existingTagAssignments.map(a => a.systemTagId);
      const toAdd = selectedTags.filter(id => !currentTagIds.includes(id));
      const toRemove = existingTagAssignments.filter(a => !selectedTags.includes(a.systemTagId));

      console.log('Tag changes', { currentTagIds, toAdd, toRemove });

      if (toRemove.length > 0) {
        await Promise.all(toRemove.map(a => base44.entities.CompanySystemTagAssignment.delete(a.id)));
        console.log('Removed tags');
      }

      if (toAdd.length > 0) {
        const assignments = toAdd.map(tagId => ({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          companyId: companyId,
          companyPublicId: company.publicId || crypto.randomUUID(),
          systemTagId: tagId,
          systemTagPublicId: tags.find(t => t.id === tagId)?.publicId || crypto.randomUUID()
        }));
        await base44.entities.CompanySystemTagAssignment.bulkCreate(assignments);
        console.log('Added tags', assignments);
      }
      
      console.log('Mutation completed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      queryClient.invalidateQueries(['company', companyId]);
      queryClient.invalidateQueries(['companySystemTagAssignments', companyId]);
      toast.success('Company updated successfully');
      navigate(createPageUrl(`CompanyDetail?id=${companyId}`));
    },
    onError: (error) => {
      toast.error('Failed to update company: ' + error.message);
    }
  });

  const validateWebsite = (url) => {
    if (!url) return true;
    
    // Remove http:// or https:// if present
    let cleanUrl = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    
    // Basic validation: must contain at least one dot and valid domain format
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(cleanUrl)) {
      return false;
    }
    
    // Domain cannot be numbers only
    const parts = cleanUrl.split('.');
    if (parts[0].match(/^\d+$/)) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted', { formData, selectedTags });
    
    if (!formData.name) {
      toast.error('Company name is required');
      return;
    }
    
    if (formData.website && !validateWebsite(formData.website)) {
      toast.error('Invalid website format. Use format: name.domain or www.name.domain');
      return;
    }
    
    // Normalize website URL
    let finalWebsite = formData.website;
    if (finalWebsite && !finalWebsite.match(/^https?:\/\//i)) {
      finalWebsite = 'https://' + finalWebsite;
    }
    
    console.log('Calling mutation', { finalWebsite, selectedTags });
    updateMutation.mutate({ ...formData, website: finalWebsite });
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
          <h1 className="text-2xl font-bold text-gray-900">Company</h1>
          <p className="text-gray-600 mt-1">{company?.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Company Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Company Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Legal Name</Label>
                <Input
                  value={formData.legalName}
                  onChange={(e) => setFormData({...formData, legalName: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="Full legal name (optional)"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Primary Role</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Select primary role" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Operator">Operator</SelectItem>
                    <SelectItem value="Owner">Owner</SelectItem>
                    <SelectItem value="Authority">Authority</SelectItem>
                    <SelectItem value="Agent">Agent</SelectItem>
                    <SelectItem value="Service Provider">Service Provider</SelectItem>
                    <SelectItem value="Other">Other / Unclassified</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">Main business role of the company. Use System Tags for additional functions (e.g., Port Authority, Regulator).</p>
              </div>
              {formData.type === 'Authority' && (
                <div className="space-y-2">
                  <Label className="text-gray-700">IACS Member</Label>
                  <div className="flex items-center gap-2 pt-2">
                    <Checkbox
                      id="iacsMember"
                      checked={formData.iacsMember}
                      onCheckedChange={(checked) => setFormData({...formData, iacsMember: checked})}
                    />
                    <Label htmlFor="iacsMember" className="cursor-pointer">
                      This authority is an IACS member
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="Main phone number"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="Main email address"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="name.domain"
                />
                <p className="text-xs text-gray-500">Enter without http://</p>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-4">Headquarters Address</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700">Address</Label>
                  <Input
                    value={formData.hqAddressLine1}
                    onChange={(e) => setFormData({...formData, hqAddressLine1: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900"
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">City</Label>
                    <Input
                      value={formData.hqCity}
                      onChange={(e) => setFormData({...formData, hqCity: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Postal Code</Label>
                    <Input
                      value={formData.hqPostalCode}
                      onChange={(e) => setFormData({...formData, hqPostalCode: e.target.value})}
                      className="bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Country</Label>
                    <SearchableSelect
                      value={formData.hqCountryId}
                      onValueChange={(value) => setFormData({...formData, hqCountryId: value})}
                      options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                      placeholder="Select country"
                      searchPlaceholder="Search countries..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Registration Country</Label>
                <SearchableSelect
                  value={formData.countryId}
                  onValueChange={(value) => setFormData({...formData, countryId: value})}
                  options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 text-gray-900"
                rows={4}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">System Tags (Functions)</Label>
              <div className="flex flex-wrap gap-2">
                {tags.filter(t => t.isActive && t.appliesTo?.includes('Company')).map(tag => (
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

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label className="text-gray-700">Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Link to={createPageUrl(`CompanyDetail?id=${companyId}`)}>
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
          </CardContent>
        </Card>
      </form>
    </div>
  );
}