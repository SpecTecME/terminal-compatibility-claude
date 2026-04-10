/**
 * Add Issuing Authority Page
 * 
 * PURPOSE:
 * Simple form for registering new document issuing authorities.
 * Links maritime regulatory and commercial organizations to the document system.
 * 
 * MINIMAL FIELDS APPROACH:
 * Only captures essential authority information:
 * - Name (official authority name)
 * - Type (classification from predefined list)
 * - Related company (optional link to Company entity)
 * - Contact email (for inquiries)
 * - Website (reference/validation)
 * - Notes (additional context)
 * 
 * CONTRAST WITH COMPANY ENTITY:
 * 
 * IssuingAuthority vs Company:
 * 
 * COMPANY:
 * - Business entity (owner, operator, shipyard, etc.)
 * - Full address, offices, legal entities
 * - Commercial relationships
 * - Broader scope
 * 
 * ISSUING AUTHORITY:
 * - Document-issuing focus
 * - Links to Company but adds document context
 * - Authority type classification
 * - Can represent governmental bodies not in Company list
 * 
 * WHY BOTH EXIST:
 * Not all issuing authorities are companies (government agencies).
 * Not all companies are issuing authorities (most aren't).
 * Separation of concerns: commercial vs regulatory roles.
 * 
 * OPTIONAL COMPANY LINK (lines 121-129):
 * 
 * companyId field links to existing Company record.
 * 
 * USE CASES:
 * - WITH link: "DNV" authority → links to "DNV AS" company
 *   Benefits: Reuse contact info, offices, see company profile
 * 
 * - WITHOUT link: "Panama Maritime Authority" (government agency)
 *   No corresponding company record needed
 * 
 * SearchableSelect provides typeahead for large company lists.
 * 
 * DEFAULT AUTHORITY TYPE (line 28):
 * Form defaults to "Classification Society".
 * Most common authority type added.
 * Reduces clicks for typical use case.
 * 
 * VALIDATION (lines 57-63):
 * Minimal validation: only name and type required.
 * Contact details optional (may not be publicly available).
 * 
 * POST-CREATE NAVIGATION:
 * Returns to IssuingAuthorities list (not detail page).
 * No detail page exists for authorities currently.
 * Simple registry model, not full entity management.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import SearchableSelect from '@/components/ui/SearchableSelect';
import { toast } from 'sonner';

export default function AddIssuingAuthority() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    name: '',
    authority_type: 'Classification Society',
    companyId: '',
    contact_email: '',
    website: '',
    notes: ''
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const companyOptions = companies.map(c => ({
    value: c.id,
    label: c.name
  }));

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.IssuingAuthority.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuingAuthorities'] });
      toast.success('Authority created successfully');
      navigate(createPageUrl('IssuingAuthorities'));
    },
    onError: (error) => {
      toast.error('Failed to create authority: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.authority_type) {
      toast.error('Please fill in required fields');
      return;
    }
    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issuing Authority</h1>
          <p className="text-gray-600 mt-1">Create a new document issuing authority</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Authority Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Authority Name *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="e.g., Lloyd's Register"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Type *</Label>
                <Select 
                  value={formData.authority_type}
                  onValueChange={(v) => setFormData({...formData, authority_type: v})}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Classification Society">Classification Society</SelectItem>
                    <SelectItem value="Flag State">Flag State</SelectItem>
                    <SelectItem value="Port State">Port State</SelectItem>
                    <SelectItem value="OCIMF">OCIMF</SelectItem>
                    <SelectItem value="Terminal">Terminal</SelectItem>
                    <SelectItem value="Owner or Operator">Owner or Operator</SelectItem>
                    <SelectItem value="Manufacturer or Shipyard">Manufacturer or Shipyard</SelectItem>
                    <SelectItem value="Engineering Consultant">Engineering Consultant</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Related Organisation</Label>
              <SearchableSelect
                options={companyOptions}
                value={formData.companyId}
                onValueChange={(value) => setFormData({...formData, companyId: value})}
                placeholder="Select a company..."
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Contact Email</Label>
                <Input
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({...formData, contact_email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="contact@authority.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Website</Label>
                <Input
                  value={formData.website}
                  onChange={(e) => setFormData({...formData, website: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="https://www.authority.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700 font-medium">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="bg-white border-gray-300 text-gray-900 min-h-[100px]"
                placeholder="Additional information..."
              />
            </div>

            <div className="flex gap-3 pt-6">
              <Button
                type="submit"
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Authority'}
              </Button>
              <Link to={createPageUrl('IssuingAuthorities')}>
                <Button type="button" variant="outline" className="border-gray-300 text-gray-700">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}