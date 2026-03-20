/**
 * Country Detail Page
 * 
 * PURPOSE:
 * Read-only view of country record showing all fields and computed status.
 * Entry point for editing country information.
 * 
 * COMPUTED ACTIVE STATUS (lines 29-42):
 * 
 * isActive() function determines if country currently valid:
 * 1. Get today's date (midnight, ignoring time)
 * 2. Compare against validFrom/validTo dates
 * 3. Return false if:
 *    - validFrom in future (not yet valid)
 *    - validTo in past (expired)
 * 4. Return true otherwise (currently active)
 * 
 * EXAMPLES:
 * - United States: validFrom=null, validTo=null → Active
 * - South Sudan: validFrom=2011-07-09, validTo=null → Active (since 2011)
 * - USSR: validFrom=null, validTo=1991-12-26 → Inactive (historical)
 * 
 * VISUAL STATUS INDICATORS (lines 58-63, 111-116):
 * 
 * Active badge: Green background, emerald text
 * Inactive badge: Gray background, gray text
 * 
 * Appears in two places:
 * - Header next to ISO codes
 * - Information section for emphasis
 * 
 * FIELD DISPLAY (lines 80-107):
 * 
 * Two-column grid showing:
 * - Country name
 * - ISO codes (both ISO2 and ISO3 if present)
 * - Valid from date (or "No start date")
 * - Valid to date (or "No end date")
 * - Active/Inactive status
 * 
 * DATE FORMATTING:
 * Uses browser's toLocaleDateString().
 * Respects user's locale preferences.
 * Consistent date display across app.
 * 
 * METADATA SECTION (lines 119-130):
 * 
 * Shows system fields:
 * - publicId: UUID for migration/portability
 * - Created date: When record first added
 * 
 * RATIONALE FOR SHOWING:
 * - publicId useful for debugging/support
 * - Created date shows data provenance
 * - Transparent about system internals
 * 
 * EDIT BUTTON (lines 67-72):
 * Navigates to EditCountry page.
 * Passes countryId as URL parameter.
 * Gradient button style indicates primary action.
 * 
 * NAVIGATION:
 * Back button returns to Countries list page.
 * User can browse other countries from there.
 */
import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Edit, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function CountryDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const countryId = urlParams.get('id');

  const { data: country, isLoading } = useQuery({
    queryKey: ['country', countryId],
    queryFn: () => base44.entities.Country.filter({ id: countryId }).then(r => r[0]),
    enabled: !!countryId
  });

  if (isLoading || !country) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const validFrom = country.validFrom ? new Date(country.validFrom) : null;
    const validTo = country.validTo ? new Date(country.validTo) : null;
    
    if (validFrom && validFrom > today) return false;
    if (validTo && validTo < today) return false;
    
    return true;
  };

  const active = isActive();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to={createPageUrl('Countries')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{country.nameEn}</h1>
            <div className="flex items-center gap-2 mt-1">
              <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{country.iso2}</code>
              {country.iso3 && <code className="bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">{country.iso3}</code>}
              <Badge className={active 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
                : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
              }>
                {active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
        <Link to={createPageUrl(`EditCountry?id=${countryId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Country Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Country Name (English)</p>
              <p className="text-gray-900 font-medium">{country.nameEn}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">ISO Codes</p>
              <div className="flex gap-2">
                <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{country.iso2}</code>
                {country.iso3 && <code className="bg-gray-100 px-2 py-1 rounded text-sm text-gray-700">{country.iso3}</code>}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Valid From</p>
              <p className="text-gray-900">
                {country.validFrom ? new Date(country.validFrom).toLocaleDateString() : 'No start date'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Valid To</p>
              <p className="text-gray-900">
                {country.validTo ? new Date(country.validTo).toLocaleDateString() : 'No end date'}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-1">Status</p>
            <Badge className={active 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 border'
              : 'bg-gray-500/10 text-gray-400 border-gray-500/30 border'
            }>
              {active ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          <div className="pt-4 border-t border-gray-200 grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Public ID</p>
              <code className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">{country.publicId}</code>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-1">Created</p>
              <p className="text-gray-700 text-sm">
                {country.created_date ? new Date(country.created_date).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}