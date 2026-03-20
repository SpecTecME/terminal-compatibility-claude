/**
 * Add Country Page
 * 
 * PURPOSE:
 * Form for creating new country records with ISO codes and temporal validity.
 * Supports both current and historical country entries.
 * 
 * FIELD EXPLANATIONS:
 * 
 * 1. NAME (English) (line 86-94):
 *    - Official English name
 *    - Examples: "United Arab Emirates", "United Kingdom", "United States"
 *    - REQUIRED field
 * 
 * 2. ISO2 CODE (line 97-107):
 *    - ISO 3166-1 alpha-2 code (2 letters)
 *    - Auto-uppercased on input (line 100)
 *    - Examples: AE, GB, US
 *    - maxLength=2 enforced (line 103)
 *    - REQUIRED field
 *    - Primary identifier for country lookups
 * 
 * 3. ISO3 CODE (line 112-121):
 *    - ISO 3166-1 alpha-3 code (3 letters)
 *    - Auto-uppercased on input (line 115)
 *    - Examples: ARE, GBR, USA
 *    - maxLength=3 enforced (line 118)
 *    - OPTIONAL field
 *    - Used for alternative lookups/integrations
 * 
 * 4. VALID FROM (line 125-134):
 *    - Date country became valid/independent
 *    - Examples:
 *      * South Sudan: 2011-07-09
 *      * East Timor: 2002-05-20
 *      * United States: 1776-07-04
 *    - Leave empty for countries with no known start (e.g., ancient nations)
 * 
 * 5. VALID TO (line 136-145):
 *    - Date country ceased to exist/be valid
 *    - Examples:
 *      * USSR: 1991-12-26
 *      * Yugoslavia: 1992-04-27
 *      * East Germany: 1990-10-03
 *    - Leave empty for currently active countries
 * 
 * VALIDATION LOGIC (lines 46-59):
 * 
 * Three validation checks before submission:
 * 1. Name and ISO2 required (both must have values)
 * 2. ISO2 exactly 2 characters (not 1, not 3)
 * 3. ISO3 exactly 3 characters if provided
 * 
 * PREVENTS:
 * - Invalid ISO codes
 * - Malformed entries
 * - Missing critical fields
 * 
 * DATA TRANSFORMATION (lines 26-31):
 * 
 * On create, system:
 * - Generates publicId (UUID for portability)
 * - Sets tenantId (multi-tenant support)
 * - Uppercases ISO codes (normalize format)
 * - Removes iso3 if empty (undefined vs empty string)
 * 
 * NAVIGATION AFTER CREATE:
 * Returns to Countries list page.
 * User sees new country in table immediately.
 * 
 * USE CASES:
 * - Adding newly independent nations
 * - Recording historical countries for legacy data
 * - Expanding geographic coverage for new regions
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function AddCountry() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    nameEn: '',
    iso2: '',
    iso3: '',
    validFrom: '',
    validTo: ''
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Country.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      iso2: data.iso2.toUpperCase(),
      iso3: data.iso3 ? data.iso3.toUpperCase() : undefined
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['countries']);
      toast.success('Country created successfully');
      navigate(createPageUrl('Countries'));
    },
    onError: (error) => {
      toast.error('Failed to create country: ' + error.message);
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

    createMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('Countries')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Add Country</h1>
          <p className="text-gray-600 mt-1">Create a new country record</p>
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
                  placeholder="United Arab Emirates"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">ISO2 Code *</Label>
                <Input
                  value={formData.iso2}
                  onChange={(e) => setFormData({...formData, iso2: e.target.value.toUpperCase()})}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="AE"
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
                  placeholder="ARE"
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
              <Link to={createPageUrl('Countries')}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                className="bg-gradient-to-r from-cyan-500 to-blue-600"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Country'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}