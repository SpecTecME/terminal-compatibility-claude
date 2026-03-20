import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '../components/utils/uuid';

export default function SeedCountriesWorld() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const worldCountries = [
    { nameEn: 'Afghanistan', iso2: 'AF', iso3: 'AFG' },
    { nameEn: 'Albania', iso2: 'AL', iso3: 'ALB' },
    { nameEn: 'Algeria', iso2: 'DZ', iso3: 'DZA' },
    { nameEn: 'Andorra', iso2: 'AD', iso3: 'AND' },
    { nameEn: 'Angola', iso2: 'AO', iso3: 'AGO' },
    { nameEn: 'Antigua and Barbuda', iso2: 'AG', iso3: 'ATG' },
    { nameEn: 'Argentina', iso2: 'AR', iso3: 'ARG' },
    { nameEn: 'Armenia', iso2: 'AM', iso3: 'ARM' },
    { nameEn: 'Australia', iso2: 'AU', iso3: 'AUS' },
    { nameEn: 'Austria', iso2: 'AT', iso3: 'AUT' },
    { nameEn: 'Azerbaijan', iso2: 'AZ', iso3: 'AZE' },
    { nameEn: 'Bahamas', iso2: 'BS', iso3: 'BHS' },
    { nameEn: 'Bahrain', iso2: 'BH', iso3: 'BHR' },
    { nameEn: 'Bangladesh', iso2: 'BD', iso3: 'BGD' },
    { nameEn: 'Barbados', iso2: 'BB', iso3: 'BRB' },
    { nameEn: 'Belarus', iso2: 'BY', iso3: 'BLR' },
    { nameEn: 'Belgium', iso2: 'BE', iso3: 'BEL' },
    { nameEn: 'Belize', iso2: 'BZ', iso3: 'BLZ' },
    { nameEn: 'Benin', iso2: 'BJ', iso3: 'BEN' },
    { nameEn: 'Bhutan', iso2: 'BT', iso3: 'BTN' },
    { nameEn: 'Bolivia', iso2: 'BO', iso3: 'BOL' },
    { nameEn: 'Bosnia and Herzegovina', iso2: 'BA', iso3: 'BIH' },
    { nameEn: 'Botswana', iso2: 'BW', iso3: 'BWA' },
    { nameEn: 'Brazil', iso2: 'BR', iso3: 'BRA' },
    { nameEn: 'Brunei', iso2: 'BN', iso3: 'BRN' },
    { nameEn: 'Bulgaria', iso2: 'BG', iso3: 'BGR' },
    { nameEn: 'Burkina Faso', iso2: 'BF', iso3: 'BFA' },
    { nameEn: 'Burundi', iso2: 'BI', iso3: 'BDI' },
    { nameEn: 'Cambodia', iso2: 'KH', iso3: 'KHM' },
    { nameEn: 'Cameroon', iso2: 'CM', iso3: 'CMR' },
    { nameEn: 'Canada', iso2: 'CA', iso3: 'CAN' },
    { nameEn: 'Cape Verde', iso2: 'CV', iso3: 'CPV' },
    { nameEn: 'Central African Republic', iso2: 'CF', iso3: 'CAF' },
    { nameEn: 'Chad', iso2: 'TD', iso3: 'TCD' },
    { nameEn: 'Chile', iso2: 'CL', iso3: 'CHL' },
    { nameEn: 'China', iso2: 'CN', iso3: 'CHN' },
    { nameEn: 'Colombia', iso2: 'CO', iso3: 'COL' },
    { nameEn: 'Comoros', iso2: 'KM', iso3: 'COM' },
    { nameEn: 'Congo', iso2: 'CG', iso3: 'COG' },
    { nameEn: 'Costa Rica', iso2: 'CR', iso3: 'CRI' },
    { nameEn: 'Croatia', iso2: 'HR', iso3: 'HRV' },
    { nameEn: 'Cuba', iso2: 'CU', iso3: 'CUB' },
    { nameEn: 'Cyprus', iso2: 'CY', iso3: 'CYP' },
    { nameEn: 'Czech Republic', iso2: 'CZ', iso3: 'CZE' },
    { nameEn: 'Democratic Republic of the Congo', iso2: 'CD', iso3: 'COD' },
    { nameEn: 'Denmark', iso2: 'DK', iso3: 'DNK' },
    { nameEn: 'Djibouti', iso2: 'DJ', iso3: 'DJI' },
    { nameEn: 'Dominica', iso2: 'DM', iso3: 'DMA' },
    { nameEn: 'Dominican Republic', iso2: 'DO', iso3: 'DOM' },
    { nameEn: 'Ecuador', iso2: 'EC', iso3: 'ECU' },
    { nameEn: 'Egypt', iso2: 'EG', iso3: 'EGY' },
    { nameEn: 'El Salvador', iso2: 'SV', iso3: 'SLV' },
    { nameEn: 'Equatorial Guinea', iso2: 'GQ', iso3: 'GNQ' },
    { nameEn: 'Eritrea', iso2: 'ER', iso3: 'ERI' },
    { nameEn: 'Estonia', iso2: 'EE', iso3: 'EST' },
    { nameEn: 'Ethiopia', iso2: 'ET', iso3: 'ETH' },
    { nameEn: 'Fiji', iso2: 'FJ', iso3: 'FJI' },
    { nameEn: 'Finland', iso2: 'FI', iso3: 'FIN' },
    { nameEn: 'France', iso2: 'FR', iso3: 'FRA' },
    { nameEn: 'Gabon', iso2: 'GA', iso3: 'GAB' },
    { nameEn: 'Gambia', iso2: 'GM', iso3: 'GMB' },
    { nameEn: 'Georgia', iso2: 'GE', iso3: 'GEO' },
    { nameEn: 'Germany', iso2: 'DE', iso3: 'DEU' },
    { nameEn: 'Ghana', iso2: 'GH', iso3: 'GHA' },
    { nameEn: 'Greece', iso2: 'GR', iso3: 'GRC' },
    { nameEn: 'Grenada', iso2: 'GD', iso3: 'GRD' },
    { nameEn: 'Guatemala', iso2: 'GT', iso3: 'GTM' },
    { nameEn: 'Guinea', iso2: 'GN', iso3: 'GIN' },
    { nameEn: 'Guinea-Bissau', iso2: 'GW', iso3: 'GNB' },
    { nameEn: 'Guyana', iso2: 'GY', iso3: 'GUY' },
    { nameEn: 'Haiti', iso2: 'HT', iso3: 'HTI' },
    { nameEn: 'Honduras', iso2: 'HN', iso3: 'HND' },
    { nameEn: 'Hungary', iso2: 'HU', iso3: 'HUN' },
    { nameEn: 'Iceland', iso2: 'IS', iso3: 'ISL' },
    { nameEn: 'India', iso2: 'IN', iso3: 'IND' },
    { nameEn: 'Indonesia', iso2: 'ID', iso3: 'IDN' },
    { nameEn: 'Iran', iso2: 'IR', iso3: 'IRN' },
    { nameEn: 'Iraq', iso2: 'IQ', iso3: 'IRQ' },
    { nameEn: 'Ireland', iso2: 'IE', iso3: 'IRL' },
    { nameEn: 'Israel', iso2: 'IL', iso3: 'ISR' },
    { nameEn: 'Italy', iso2: 'IT', iso3: 'ITA' },
    { nameEn: 'Ivory Coast', iso2: 'CI', iso3: 'CIV' },
    { nameEn: 'Jamaica', iso2: 'JM', iso3: 'JAM' },
    { nameEn: 'Japan', iso2: 'JP', iso3: 'JPN' },
    { nameEn: 'Jordan', iso2: 'JO', iso3: 'JOR' },
    { nameEn: 'Kazakhstan', iso2: 'KZ', iso3: 'KAZ' },
    { nameEn: 'Kenya', iso2: 'KE', iso3: 'KEN' },
    { nameEn: 'Kiribati', iso2: 'KI', iso3: 'KIR' },
    { nameEn: 'Kosovo', iso2: 'XK', iso3: 'XKX' },
    { nameEn: 'Kuwait', iso2: 'KW', iso3: 'KWT' },
    { nameEn: 'Kyrgyzstan', iso2: 'KG', iso3: 'KGZ' },
    { nameEn: 'Laos', iso2: 'LA', iso3: 'LAO' },
    { nameEn: 'Latvia', iso2: 'LV', iso3: 'LVA' },
    { nameEn: 'Lebanon', iso2: 'LB', iso3: 'LBN' },
    { nameEn: 'Lesotho', iso2: 'LS', iso3: 'LSO' },
    { nameEn: 'Liberia', iso2: 'LR', iso3: 'LBR' },
    { nameEn: 'Libya', iso2: 'LY', iso3: 'LBY' },
    { nameEn: 'Liechtenstein', iso2: 'LI', iso3: 'LIE' },
    { nameEn: 'Lithuania', iso2: 'LT', iso3: 'LTU' },
    { nameEn: 'Luxembourg', iso2: 'LU', iso3: 'LUX' },
    { nameEn: 'Madagascar', iso2: 'MG', iso3: 'MDG' },
    { nameEn: 'Malawi', iso2: 'MW', iso3: 'MWI' },
    { nameEn: 'Malaysia', iso2: 'MY', iso3: 'MYS' },
    { nameEn: 'Maldives', iso2: 'MV', iso3: 'MDV' },
    { nameEn: 'Mali', iso2: 'ML', iso3: 'MLI' },
    { nameEn: 'Malta', iso2: 'MT', iso3: 'MLT' },
    { nameEn: 'Marshall Islands', iso2: 'MH', iso3: 'MHL' },
    { nameEn: 'Mauritania', iso2: 'MR', iso3: 'MRT' },
    { nameEn: 'Mauritius', iso2: 'MU', iso3: 'MUS' },
    { nameEn: 'Mexico', iso2: 'MX', iso3: 'MEX' },
    { nameEn: 'Micronesia', iso2: 'FM', iso3: 'FSM' },
    { nameEn: 'Moldova', iso2: 'MD', iso3: 'MDA' },
    { nameEn: 'Monaco', iso2: 'MC', iso3: 'MCO' },
    { nameEn: 'Mongolia', iso2: 'MN', iso3: 'MNG' },
    { nameEn: 'Montenegro', iso2: 'ME', iso3: 'MNE' },
    { nameEn: 'Morocco', iso2: 'MA', iso3: 'MAR' },
    { nameEn: 'Mozambique', iso2: 'MZ', iso3: 'MOZ' },
    { nameEn: 'Myanmar', iso2: 'MM', iso3: 'MMR' },
    { nameEn: 'Namibia', iso2: 'NA', iso3: 'NAM' },
    { nameEn: 'Nauru', iso2: 'NR', iso3: 'NRU' },
    { nameEn: 'Nepal', iso2: 'NP', iso3: 'NPL' },
    { nameEn: 'Netherlands', iso2: 'NL', iso3: 'NLD' },
    { nameEn: 'New Zealand', iso2: 'NZ', iso3: 'NZL' },
    { nameEn: 'Nicaragua', iso2: 'NI', iso3: 'NIC' },
    { nameEn: 'Niger', iso2: 'NE', iso3: 'NER' },
    { nameEn: 'Nigeria', iso2: 'NG', iso3: 'NGA' },
    { nameEn: 'North Korea', iso2: 'KP', iso3: 'PRK' },
    { nameEn: 'North Macedonia', iso2: 'MK', iso3: 'MKD' },
    { nameEn: 'Norway', iso2: 'NO', iso3: 'NOR' },
    { nameEn: 'Oman', iso2: 'OM', iso3: 'OMN' },
    { nameEn: 'Pakistan', iso2: 'PK', iso3: 'PAK' },
    { nameEn: 'Palau', iso2: 'PW', iso3: 'PLW' },
    { nameEn: 'Palestine', iso2: 'PS', iso3: 'PSE' },
    { nameEn: 'Panama', iso2: 'PA', iso3: 'PAN' },
    { nameEn: 'Papua New Guinea', iso2: 'PG', iso3: 'PNG' },
    { nameEn: 'Paraguay', iso2: 'PY', iso3: 'PRY' },
    { nameEn: 'Peru', iso2: 'PE', iso3: 'PER' },
    { nameEn: 'Philippines', iso2: 'PH', iso3: 'PHL' },
    { nameEn: 'Poland', iso2: 'PL', iso3: 'POL' },
    { nameEn: 'Portugal', iso2: 'PT', iso3: 'PRT' },
    { nameEn: 'Qatar', iso2: 'QA', iso3: 'QAT' },
    { nameEn: 'Romania', iso2: 'RO', iso3: 'ROU' },
    { nameEn: 'Russia', iso2: 'RU', iso3: 'RUS' },
    { nameEn: 'Rwanda', iso2: 'RW', iso3: 'RWA' },
    { nameEn: 'Saint Kitts and Nevis', iso2: 'KN', iso3: 'KNA' },
    { nameEn: 'Saint Lucia', iso2: 'LC', iso3: 'LCA' },
    { nameEn: 'Saint Vincent and the Grenadines', iso2: 'VC', iso3: 'VCT' },
    { nameEn: 'Samoa', iso2: 'WS', iso3: 'WSM' },
    { nameEn: 'San Marino', iso2: 'SM', iso3: 'SMR' },
    { nameEn: 'Sao Tome and Principe', iso2: 'ST', iso3: 'STP' },
    { nameEn: 'Saudi Arabia', iso2: 'SA', iso3: 'SAU' },
    { nameEn: 'Senegal', iso2: 'SN', iso3: 'SEN' },
    { nameEn: 'Serbia', iso2: 'RS', iso3: 'SRB' },
    { nameEn: 'Seychelles', iso2: 'SC', iso3: 'SYC' },
    { nameEn: 'Sierra Leone', iso2: 'SL', iso3: 'SLE' },
    { nameEn: 'Singapore', iso2: 'SG', iso3: 'SGP' },
    { nameEn: 'Slovakia', iso2: 'SK', iso3: 'SVK' },
    { nameEn: 'Slovenia', iso2: 'SI', iso3: 'SVN' },
    { nameEn: 'Solomon Islands', iso2: 'SB', iso3: 'SLB' },
    { nameEn: 'Somalia', iso2: 'SO', iso3: 'SOM' },
    { nameEn: 'South Africa', iso2: 'ZA', iso3: 'ZAF' },
    { nameEn: 'South Korea', iso2: 'KR', iso3: 'KOR' },
    { nameEn: 'South Sudan', iso2: 'SS', iso3: 'SSD' },
    { nameEn: 'Spain', iso2: 'ES', iso3: 'ESP' },
    { nameEn: 'Sri Lanka', iso2: 'LK', iso3: 'LKA' },
    { nameEn: 'Sudan', iso2: 'SD', iso3: 'SDN' },
    { nameEn: 'Suriname', iso2: 'SR', iso3: 'SUR' },
    { nameEn: 'Sweden', iso2: 'SE', iso3: 'SWE' },
    { nameEn: 'Switzerland', iso2: 'CH', iso3: 'CHE' },
    { nameEn: 'Syria', iso2: 'SY', iso3: 'SYR' },
    { nameEn: 'Taiwan', iso2: 'TW', iso3: 'TWN' },
    { nameEn: 'Tajikistan', iso2: 'TJ', iso3: 'TJK' },
    { nameEn: 'Tanzania', iso2: 'TZ', iso3: 'TZA' },
    { nameEn: 'Thailand', iso2: 'TH', iso3: 'THA' },
    { nameEn: 'Timor-Leste', iso2: 'TL', iso3: 'TLS' },
    { nameEn: 'Togo', iso2: 'TG', iso3: 'TGO' },
    { nameEn: 'Tonga', iso2: 'TO', iso3: 'TON' },
    { nameEn: 'Trinidad and Tobago', iso2: 'TT', iso3: 'TTO' },
    { nameEn: 'Tunisia', iso2: 'TN', iso3: 'TUN' },
    { nameEn: 'Turkey', iso2: 'TR', iso3: 'TUR' },
    { nameEn: 'Turkmenistan', iso2: 'TM', iso3: 'TKM' },
    { nameEn: 'Tuvalu', iso2: 'TV', iso3: 'TUV' },
    { nameEn: 'Uganda', iso2: 'UG', iso3: 'UGA' },
    { nameEn: 'Ukraine', iso2: 'UA', iso3: 'UKR' },
    { nameEn: 'United Arab Emirates', iso2: 'AE', iso3: 'ARE' },
    { nameEn: 'United Kingdom', iso2: 'GB', iso3: 'GBR' },
    { nameEn: 'United States', iso2: 'US', iso3: 'USA' },
    { nameEn: 'Uruguay', iso2: 'UY', iso3: 'URY' },
    { nameEn: 'Uzbekistan', iso2: 'UZ', iso3: 'UZB' },
    { nameEn: 'Vanuatu', iso2: 'VU', iso3: 'VUT' },
    { nameEn: 'Vatican City', iso2: 'VA', iso3: 'VAT' },
    { nameEn: 'Venezuela', iso2: 'VE', iso3: 'VEN' },
    { nameEn: 'Vietnam', iso2: 'VN', iso3: 'VNM' },
    { nameEn: 'Yemen', iso2: 'YE', iso3: 'YEM' },
    { nameEn: 'Zambia', iso2: 'ZM', iso3: 'ZMB' },
    { nameEn: 'Zimbabwe', iso2: 'ZW', iso3: 'ZWE' }
  ];

  const handleSeed = async () => {
    setProcessing(true);
    try {
      const existing = await base44.entities.Country.list();
      const existingNames = existing.map(c => c.nameEn.toLowerCase());
      
      const newCountries = worldCountries.filter(c => !existingNames.includes(c.nameEn.toLowerCase()));
      
      if (newCountries.length === 0) {
        setResults({ created: 0, skipped: worldCountries.length });
        toast.info('All countries already exist');
        return;
      }

      const countriesToCreate = newCountries.map((country, idx) => ({
        publicId: generateUUID(),
        tenantId: 'default-tenant',
        nameEn: country.nameEn,
        iso2: country.iso2,
        iso3: country.iso3,
        isActive: true,
        sortOrder: idx
      }));

      await base44.entities.Country.bulkCreate(countriesToCreate);
      
      setResults({ created: newCountries.length, skipped: worldCountries.length - newCountries.length });
      toast.success(`Created ${newCountries.length} countries`);
    } catch (error) {
      toast.error('Failed to seed countries: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed World Countries</h1>
        <p className="text-gray-600 mt-1">Populate Country table with world list (English names)</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">World Countries ({worldCountries.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-64 overflow-y-auto border border-gray-200 rounded-lg p-3">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm text-gray-700">
              {worldCountries.map(country => (
                <div key={country.iso2}>{country.nameEn} ({country.iso2})</div>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSeed}
            disabled={processing}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {processing ? 'Seeding...' : 'Seed Countries'}
          </Button>

          {results && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-medium text-emerald-900">Seeding Complete</p>
              </div>
              <p className="text-sm text-emerald-700">Created: {results.created} countries</p>
              <p className="text-sm text-emerald-700">Skipped: {results.skipped} (already exist)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}