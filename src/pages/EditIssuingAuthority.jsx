/**
 * Edit Issuing Authority Page
 * 
 * PURPOSE:
 * Updates existing issuing authority records with identical form as AddIssuingAuthority.
 * Maintains authority registry information for document validation system.
 * 
 * SAME FORM AS ADD:
 * Identical fields and validation as AddIssuingAuthority.
 * See AddIssuingAuthority documentation for field explanations.
 * 
 * QUERY PATTERN DIFFERENCE (lines 37-43):
 * 
 * Uses .list().then(find) instead of .filter():
 * Optimization for single-record lookup when ID known.
 * 
 * ALTERNATIVE APPROACHES:
 * - base44.entities.IssuingAuthority.filter({ id: authId }).then(r => r[0])
 * - Custom getById method (if Base44 SDK had one)
 * 
 * Current approach works, loads all then finds.
 * IssuingAuthority typically small dataset (<100 records).
 * 
 * STATE INITIALIZATION (lines 55-66):
 * Populates form when authority data loads.
 * useEffect watches authority query result.
 * Null-safe: uses || '' to prevent undefined values in inputs.
 * 
 * DUAL QUERY INVALIDATION (lines 71-72):
 * Invalidates both:
 * - List query (issuingAuthorities)
 * - Detail query (issuingAuthority, authId)
 * 
 * Ensures both list page and potential detail views refresh.
 * Defensive pattern even though detail page doesn't exist yet.
 * 
 * NAVIGATION:
 * Returns to IssuingAuthorities list after save.
 * Consistent with AddIssuingAuthority flow.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft } from 'lucide-react';
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

export default function EditIssuingAuthority() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const authId = urlParams.get('id');

  const [formData, setFormData] = useState({
    name: '',
    authority_type: 'Classification Society',
    companyId: '',
    contact_email: '',
    website: '',
    notes: ''
  });

  const { data: authority, isLoading } = useQuery({
    queryKey: ['issuingAuthority', authId],
    queryFn: () => base44.entities.IssuingAuthority.list().then(auths => 
      auths.find(a => a.id === authId)
    ),
    enabled: !!authId
  });

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => base44.entities.Company.list()
  });

  const companyOptions = companies.map(c => ({
    value: c.id,
    label: c.name
  }));

  useEffect(() => {
    if (authority) {
      setFormData({
        name: authority.name || '',
        authority_type: authority.authority_type || 'Classification Society',
        companyId: authority.companyId || '',
        contact_email: authority.contact_email || '',
        website: authority.website || '',
        notes: authority.notes || ''
      });
    }
  }, [authority]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.IssuingAuthority.update(authId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issuingAuthorities'] });
      queryClient.invalidateQueries({ queryKey: ['issuingAuthority', authId] });
      toast.success('Authority updated successfully');
      navigate(createPageUrl('IssuingAuthorities'));
    },
    onError: (error) => {
      toast.error('Failed to update authority: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.authority_type) {
      toast.error('Please fill in required fields');
      return;
    }
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authority) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Authority not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('IssuingAuthorities')}>
          <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Issuing Authority</h1>
          <p className="text-gray-600 mt-1">Update authority details</p>
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
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
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