/**
 * Edit Country Page
 * 
 * PURPOSE:
 * Update existing country records including name, ISO codes, and temporal validity.
 * Identical form fields as AddCountry but pre-populated with existing data.
 * 
 * EDIT PATTERN:
 * 1. Query country by ID (lines 27-31)
 * 2. Populate form state on load (lines 33-43)
 * 3. User modifies fields
 * 4. Update mutation saves changes (lines 45-60)
 * 5. Navigate to detail page (not list) (line 55)
 * 
 * NAVIGATION DIFFERENCE FROM ADD:
 * - Add → navigates to Countries list
 * - Edit → navigates to CountryDetail (specific record)
 * 
 * RATIONALE:
 * After editing, user likely wants to see the updated detail page.
 * Confirms changes were saved correctly.
 * Provides context for next action.
 * 
 * DUAL QUERY INVALIDATION (lines 52-53):
 * Invalidates both:
 * - List cache (countries)
 * - Detail cache (country, countryId)
 * 
 * Ensures both views refresh with updated data.
 * 
 * SAME VALIDATION AS ADD (lines 65-78):
 * Identical client-side validation:
 * - Name and ISO2 required
 * - ISO2 exactly 2 characters
 * - ISO3 exactly 3 characters if provided
 * 
 * DATA TRANSFORMATION (lines 46-50):
 * Same uppercasing logic as AddCountry.
 * Ensures consistent format regardless of user input.
 * 
 * TEMPORAL VALIDITY UPDATES:
 * 
 * COMMON SCENARIOS:
 * 1. Set end date for historical country:
 *    - USSR validTo: null → 1991-12-26
 *    - Marks country as inactive
 * 
 * 2. Correct start date:
 *    - South Sudan validFrom: null → 2011-07-09
 *    - Adds historical accuracy
 * 
 * 3. Extend validity:
 *    - Clear validTo date
 *    - Reactivate country if needed
 * 
 * LOADING STATE (lines 83-89):
 * Shows spinner while fetching country data.
 * Prevents form flash/flicker.
 * User sees loading feedback immediately.
 */
import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function EditCountry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const countryId = urlParams.get('id');

  const [formData, setFormData] = useState({
    nameEn: '',
    iso2: '',
    iso3: '',
    validFrom: '',
    validTo: ''
  });

  const { data: country, isLoading } = useQuery({
    queryKey: ['country', countryId],
    queryFn: () => base44.entities.Country.filter({ id: countryId }).then(r => r[0]),
    enabled: !!countryId
  });

  useEffect(() => {
    if (country) {
      setFormData({
        nameEn: country.nameEn || '',
        iso2: country.iso2 || '',
        iso3: country.iso3 || '',
        validFrom: country.validFrom || '',
        validTo: country.validTo || ''
      });
    }
  }, [country]);

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.Country.update(countryId, {
      ...data,
      iso2: data.iso2.toUpperCase(),
      iso3: data.iso3 ? data.iso3.toUpperCase() : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['countries']);
      queryClient.invalidateQueries(['country', countryId]);
      toast.success('Country updated successfully');
      navigate(createPageUrl(`CountryDetail?id=${countryId}`));
    },
    onError: (error) => {
      toast.error('Failed to update country: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.nameEn || !formData.iso2) {
      toast.error('Country name and ISO2 code are required');
      return;
    }

    if (formData.iso2.length !== 2) {
      toast.error('ISO2 code must be exactly 2 characters');
      return;
    }

    if (formData.iso3 && formData.iso3.length !== 3) {
      toast.error('ISO3 code must be exactly 3 characters');
      return;
    }

    updateMutation.mutate(formData);
  };

  if (isLoading || !country) {
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
          <h1 className="text-2xl font-bold text-gray-900">Country</h1>
          <p className="text-gray-600 mt-1">{country.nameEn}</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Country Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Country Name (English) *</Label>
                <Input
                  value={formData.nameEn}
                  onChange={(e) => setFormData({...formData, nameEn: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">ISO2 Code *</Label>
                <Input
                  value={formData.iso2}
                  onChange={(e) => setFormData({...formData, iso2: e.target.value.toUpperCase()})}
                  className="bg-white border-gray-300 text-gray-900"
                  maxLength={2}
                  required
                />
                <p className="text-xs text-gray-500">2-character ISO code (e.g., AE, US, GB)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">ISO3 Code (optional)</Label>
                <Input
                  value={formData.iso3}
                  onChange={(e) => setFormData({...formData, iso3: e.target.value.toUpperCase()})}
                  className="bg-white border-gray-300 text-gray-900"
                  maxLength={3}
                />
                <p className="text-xs text-gray-500">3-character ISO code (e.g., ARE, USA, GBR)</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-gray-700">Valid From</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({...formData, validFrom: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500">Leave empty for no start date restriction</p>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Valid To</Label>
                <Input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({...formData, validTo: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900"
                />
                <p className="text-xs text-gray-500">Leave empty for currently active country</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <Link to={createPageUrl(`CountryDetail?id=${countryId}`)}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}