import React, { useState } from 'react';
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
import SearchableSelect from '../components/ui/SearchableSelect';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

/**
 * Add Company Page (CRM Module)
 * 
 * PURPOSE:
 * Creates new company records with dual tag system (system + user tags).
 * Companies are core entities participating in multiple maritime business relationships.
 * 
 * DUAL TAG ARCHITECTURE:
 * 
 * 1. SYSTEM TAGS (Global, Admin-Managed):
 *    - Defined by administrators in SystemTag entity
 *    - Visible to all users
 *    - Machine-readable classifications for filtering
 *    - Examples: "IACS Member", "Classification Society", "Ship Owner"
 *    - Stored in CompanySystemTagAssignment junction table
 *    - Used for business logic and system-wide filtering
 * 
 * 2. USER TAGS (Personal, User-Specific):
 *    - Created and managed by individual users
 *    - Private to creating user (not visible to others)
 *    - Supports personal workflow organization
 *    - Examples: "My Preferred Vendors", "Urgent Follow-Up", "VIP Client"
 *    - Stored in UserCompanyTagAssignment junction table
 *    - Used for personal productivity and filtering
 * 
 * KEY BUSINESS RULES:
 * 
 * 1. NAME vs LEGAL NAME:
 *    - 'name' = Brand name / common name (required)
 *    - 'legalName' = Full registered legal entity name (optional)
 *    - Example: name="Shell", legalName="Royal Dutch Shell plc"
 * 
 * 2. PRIMARY ROLE (TYPE):
 *    - Single-select categorization: Operator, Owner, Authority, Agent, Service Provider, Other
 *    - Provides basic classification
 *    - System Tags allow multi-role (company can be both Owner AND Operator)
 * 
 * 3. IACS MEMBERSHIP:
 *    - Special boolean flag for classification societies
 *    - Only visible/relevant when type = "Authority"
 *    - IACS = International Association of Classification Societies
 *    - Critical quality indicator for ship classification
 * 
 * 4. DUAL COUNTRY REFERENCES:
 *    - countryId = Country of incorporation/registration
 *    - hqCountryId = Country where headquarters located
 *    - Can differ (e.g., incorporated in Liberia, HQ in London)
 *    - Important for regulatory and tax contexts
 * 
 * 5. WEBSITE VALIDATION & NORMALIZATION:
 *    - Accepts input without protocol (user-friendly)
 *    - Auto-prepends "https://" for storage
 *    - Validates domain format to prevent junk data
 *    - Rejects pure numeric domains
 * 
 * 6. INLINE TAG CREATION:
 *    - Users can create new personal tags during company creation
 *    - Immediate assignment to new company
 *    - Streamlined workflow (no separate tag management step)
 * 
 * DATA FLOW:
 * 1. Create Company entity
 * 2. Create CompanySystemTagAssignment records (if any system tags selected)
 * 3. Create UserCompanyTagAssignment records (if any user tags selected)
 * 4. All in single mutation transaction
 */
export default function AddCompany() {
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

  const [selectedTags, setSelectedTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  const { data: allCountries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: tags = [] } = useQuery({
    queryKey: ['systemTags'],
    queryFn: () => base44.entities.SystemTag.list()
  });

  const { data: userTags = [] } = useQuery({
    queryKey: ['userTags'],
    queryFn: () => base44.entities.UserTag.list()
  });

  const [user, setUser] = React.useState(null);
  const [selectedUserTags, setSelectedUserTags] = useState([]);

  React.useEffect(() => {
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

  /**
   * Filter countries to show only currently valid ones
   * 
   * VALIDITY LOGIC:
   * Countries have validFrom and validTo dates for temporal validity.
   * This supports:
   * - Historical countries (e.g., USSR, Yugoslavia - validTo in past)
   * - Future countries (validFrom > today)
   * - Current countries (validFrom <= today < validTo, or validTo is null)
   * 
   * BUSINESS RULE:
   * Only show countries valid TODAY in creation forms.
   * Historical/future countries available in other contexts (reporting, migration).
   * 
   * NULL HANDLING:
   * - validFrom null → valid from beginning of time
   * - validTo null → valid indefinitely (most common for current countries)
   */
  const isCountryActive = (country) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    // Not yet valid
    if (validFrom && validFrom > today) return false;
    // No longer valid
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const countries = allCountries.filter(c => isCountryActive(c)).sort((a, b) => a.nameEn.localeCompare(b.nameEn));

  const createMutation = useMutation({
    mutationFn: async (data) => {
      const company = await base44.entities.Company.create({
        ...data,
        publicId: crypto.randomUUID(),
        tenantId: 'default-tenant',
        countryPublicId: countries.find(c => c.id === data.countryId)?.publicId
      });

      // Create system tag assignments
      if (selectedTags.length > 0) {
        const assignments = selectedTags.map(tagId => ({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          companyId: company.id,
          companyPublicId: company.publicId,
          systemTagId: tagId,
          systemTagPublicId: tags.find(t => t.id === tagId)?.publicId
        }));
        await base44.entities.CompanySystemTagAssignment.bulkCreate(assignments);
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
            companyId: company.id,
            companyPublicId: company.publicId,
            userTagId: tagId,
            userTagPublicId: tag?.publicId || crypto.randomUUID()
          };
        });
        await base44.entities.UserCompanyTagAssignment.bulkCreate(userTagAssignments);
      }

      return company;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['companies']);
      toast.success('Company created successfully');
      navigate(createPageUrl('Companies'));
    },
    onError: (error) => {
      toast.error('Failed to create company: ' + error.message);
    }
  });

  /**
   * Validate website URL format
   * 
   * VALIDATION RULES:
   * 1. Empty string is valid (optional field)
   * 2. Must be valid domain format: subdomain.domain.tld
   * 3. Cannot be pure numbers (e.g., "123.456" invalid)
   * 4. Accepts input with/without protocol
   * 5. Accepts input with/without www
   * 
   * CLEANING PROCESS:
   * - Strips http://, https://, www. for validation
   * - Pattern requires: letter/number start + dot + valid TLD
   * - Prevents malformed URLs from entering database
   * 
   * NORMALIZATION:
   * Input is validated in cleaned form, but stored with https:// prefix
   * (see handleSubmit where finalWebsite is prepended with https://)
   */
  const validateWebsite = (url) => {
    if (!url) return true;
    
    // Remove protocol and www for validation
    let cleanUrl = url.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    
    // Validate domain format: name.tld (minimum structure)
    const domainPattern = /^[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}$/;
    if (!domainPattern.test(cleanUrl)) {
      return false;
    }
    
    // Reject pure numeric domains (likely input errors)
    const parts = cleanUrl.split('.');
    if (parts[0].match(/^\d+$/)) {
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
    
    createMutation.mutate({ ...formData, website: finalWebsite });
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Company</h1>
          <p className="text-gray-600 mt-1">Create a new company record</p>
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

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({...formData, isActive: checked})}
              />
              <Label className="text-gray-700">Active</Label>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
              <Link to={createPageUrl('Companies')}>
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
                {createMutation.isPending ? 'Creating...' : 'Create Company'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}