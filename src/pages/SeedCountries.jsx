import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { generateUUID } from '../components/utils/uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const commonCountries = [
  { iso2: 'AE', iso3: 'ARE', nameEn: 'United Arab Emirates' },
  { iso2: 'US', iso3: 'USA', nameEn: 'United States' },
  { iso2: 'GB', iso3: 'GBR', nameEn: 'United Kingdom' },
  { iso2: 'SA', iso3: 'SAU', nameEn: 'Saudi Arabia' },
  { iso2: 'QA', iso3: 'QAT', nameEn: 'Qatar' },
  { iso2: 'KW', iso3: 'KWT', nameEn: 'Kuwait' },
  { iso2: 'OM', iso3: 'OMN', nameEn: 'Oman' },
  { iso2: 'BH', iso3: 'BHR', nameEn: 'Bahrain' },
  { iso2: 'SG', iso3: 'SGP', nameEn: 'Singapore' },
  { iso2: 'JP', iso3: 'JPN', nameEn: 'Japan' },
  { iso2: 'CN', iso3: 'CHN', nameEn: 'China' },
  { iso2: 'KR', iso3: 'KOR', nameEn: 'South Korea' },
  { iso2: 'IN', iso3: 'IND', nameEn: 'India' },
  { iso2: 'AU', iso3: 'AUS', nameEn: 'Australia' },
  { iso2: 'NL', iso3: 'NLD', nameEn: 'Netherlands' },
  { iso2: 'BE', iso3: 'BEL', nameEn: 'Belgium' },
  { iso2: 'FR', iso3: 'FRA', nameEn: 'France' },
  { iso2: 'DE', iso3: 'DEU', nameEn: 'Germany' },
  { iso2: 'IT', iso3: 'ITA', nameEn: 'Italy' },
  { iso2: 'ES', iso3: 'ESP', nameEn: 'Spain' },
  { iso2: 'NO', iso3: 'NOR', nameEn: 'Norway' },
  { iso2: 'SE', iso3: 'SWE', nameEn: 'Sweden' },
  { iso2: 'DK', iso3: 'DNK', nameEn: 'Denmark' },
  { iso2: 'FI', iso3: 'FIN', nameEn: 'Finland' },
  { iso2: 'PL', iso3: 'POL', nameEn: 'Poland' },
  { iso2: 'RU', iso3: 'RUS', nameEn: 'Russia' },
  { iso2: 'RS', iso3: 'SRB', nameEn: 'Serbia' },
  { iso2: 'TR', iso3: 'TUR', nameEn: 'Turkey' },
  { iso2: 'EG', iso3: 'EGY', nameEn: 'Egypt' },
  { iso2: 'BR', iso3: 'BRA', nameEn: 'Brazil' },
  { iso2: 'MX', iso3: 'MEX', nameEn: 'Mexico' },
  { iso2: 'CA', iso3: 'CAN', nameEn: 'Canada' },
  { iso2: 'MY', iso3: 'MYS', nameEn: 'Malaysia' },
  { iso2: 'TH', iso3: 'THA', nameEn: 'Thailand' },
  { iso2: 'ID', iso3: 'IDN', nameEn: 'Indonesia' },
  { iso2: 'PH', iso3: 'PHL', nameEn: 'Philippines' }
];

export default function SeedCountries() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSeed = async () => {
    setLoading(true);
    let created = 0;
    let skipped = 0;

    try {
      const existing = await base44.entities.Country.list();
      const existingIso2 = new Set(existing.map(c => c.iso2));

      for (const country of commonCountries) {
        if (existingIso2.has(country.iso2)) {
          skipped++;
          continue;
        }

        await base44.entities.Country.create({
          publicId: generateUUID(),
          ...country,
          isActive: true
        });
        created++;
      }

      setResult({ created, skipped, total: commonCountries.length });
      toast.success(`Seeded ${created} countries`);
    } catch (error) {
      toast.error('Seeding failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Country Master Data</h1>
        <p className="text-gray-600 mt-1">
          Populate the Country table with common ISO country codes
        </p>
      </div>

      <Alert>
        <AlertDescription>
          This will create {commonCountries.length} common countries with ISO2, ISO3, and English names.
          Existing countries will be skipped.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Seed Countries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleSeed}
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Country Data'
            )}
          </Button>

          {result && (
            <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span className="font-medium text-emerald-900">Seeding Complete</span>
              </div>
              <div className="text-sm text-emerald-800 space-y-1">
                <p>Total: {result.total}</p>
                <p>Created: {result.created}</p>
                <p>Skipped (already exist): {result.skipped}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}