import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolveCountry } from '../components/services/countryAliasService';

export default function SeedNakilatPartners() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      const existingCompanies = await base44.entities.Company.list();

      // Define Nakilat partner companies
      const partnerData = [
        // Group A: Vessel owners, operators, ship managers
        {
          name: 'NYK Line',
          legalName: 'Nippon Yusen Kabushiki Kaisha',
          type: 'Owner',
          hqAddressLine1: '2-3-2 Marunouchi, Chiyoda-ku',
          hqCity: 'Tokyo',
          hqPostalCode: '100-0005',
          hqCountry: 'Japan',
          website: 'https://www.nyk.com',
          notes: 'LNG vessel owner and operator, Nakilat partner.'
        },
        {
          name: 'K Line',
          legalName: 'Kawasaki Kisen Kaisha, Ltd.',
          type: 'Owner',
          hqAddressLine1: 'Iino Building, 1-1-1 Uchisaiwaicho, Chiyoda-ku',
          hqCity: 'Tokyo',
          hqPostalCode: '100-8540',
          hqCountry: 'Japan',
          website: 'https://www.kline.co.jp',
          notes: 'LNG vessel owner and operator.'
        },
        {
          name: 'Teekay',
          legalName: 'Teekay LNG Partners L.P.',
          type: 'Owner',
          hqAddressLine1: '4th Floor, Belvedere Building, 69 Pitts Bay Road',
          hqCity: 'Hamilton',
          hqPostalCode: 'HM 08',
          hqCountry: 'Bermuda',
          website: 'https://www.teekay.com',
          notes: 'LNG carrier owner and manager.'
        },
        {
          name: 'SCI',
          legalName: 'The Shipping Corporation of India Ltd.',
          type: 'Owner',
          hqAddressLine1: 'Shipping House, 245 Madam Cama Road',
          hqCity: 'Mumbai',
          hqPostalCode: '400021',
          hqCountry: 'India',
          website: 'https://www.shipindia.com',
          notes: 'LNG vessel owner, Indian state shipping company.'
        },
        {
          name: 'International Seaways',
          legalName: 'International Seaways, Inc.',
          type: 'Operator',
          hqAddressLine1: '600 Third Avenue, 39th Floor',
          hqCity: 'New York',
          hqPostalCode: '10016',
          hqCountry: 'United States',
          website: 'https://www.insw.com',
          notes: 'Tanker and LNG shipping operator.'
        },
        {
          name: 'Pronav',
          legalName: 'Pronav Ship Management Pvt. Ltd.',
          type: 'Service Provider',
          hqAddressLine1: '1st Floor, Raheja Chambers, Nariman Point',
          hqCity: 'Mumbai',
          hqPostalCode: '400021',
          hqCountry: 'India',
          website: 'https://www.pronavship.com',
          notes: 'Technical and ship management partner.'
        },
        // Group B: Charterers, LNG traders, energy majors
        {
          name: 'Shell',
          legalName: 'Shell plc',
          type: 'Other',
          hqAddressLine1: 'Shell Centre, York Road',
          hqCity: 'London',
          hqPostalCode: 'SE1 7NA',
          hqCountry: 'United Kingdom',
          website: 'https://www.shell.com',
          notes: 'LNG charterer and trader (via STASCO).'
        },
        {
          name: 'Glencore',
          legalName: 'Glencore plc',
          type: 'Other',
          hqAddressLine1: 'Baarermattstrasse 3',
          hqCity: 'Baar',
          hqPostalCode: '6340',
          hqCountry: 'Switzerland',
          website: 'https://www.glencore.com',
          notes: 'Global LNG and commodity trader.'
        },
        {
          name: 'ExxonMobil',
          legalName: 'Exxon Mobil Corporation',
          type: 'Other',
          hqAddressLine1: '22777 Springwoods Village Parkway',
          hqCity: 'Spring, Texas',
          hqPostalCode: '77389',
          hqCountry: 'United States',
          website: 'https://corporate.exxonmobil.com',
          notes: 'LNG producer and charterer.'
        },
        {
          name: 'Gunvor',
          legalName: 'Gunvor Group Ltd',
          type: 'Other',
          hqAddressLine1: '10 Rue de Chantepoulet',
          hqCity: 'Geneva',
          hqPostalCode: '1201',
          hqCountry: 'Switzerland',
          website: 'https://gunvorgroup.com',
          notes: 'LNG and energy trader.'
        },
        {
          name: 'Cheniere',
          legalName: 'Cheniere Energy, Inc.',
          type: 'Other',
          hqAddressLine1: '700 Milam Street, Suite 1900',
          hqCity: 'Houston',
          hqPostalCode: '77002',
          hqCountry: 'United States',
          website: 'https://www.cheniere.com',
          notes: 'LNG producer and exporter.'
        },
        {
          name: 'Petronet LNG',
          legalName: 'Petronet LNG Limited',
          type: 'Other',
          hqAddressLine1: 'World Trade Centre, Babar Road',
          hqCity: 'New Delhi',
          hqPostalCode: '110001',
          hqCountry: 'India',
          website: 'https://www.petronetlng.in',
          notes: 'LNG importer and charter counterparty (PLL).'
        },
        {
          name: 'Methane Services Limited',
          legalName: 'Methane Services Limited',
          type: 'Service Provider',
          hqAddressLine1: 'Methane House, North Esplanade West',
          hqCity: 'Aberdeen',
          hqPostalCode: 'AB11 5QH',
          hqCountry: 'United Kingdom',
          website: 'https://www.msl-ltd.com',
          notes: 'LNG shipping and technical services provider.'
        },
        // Group C: Marine services, shipyards, offshore JVs
        {
          name: 'Keppel O&M',
          legalName: 'Keppel Offshore & Marine Ltd',
          type: 'Service Provider',
          hqAddressLine1: '50 Gul Road',
          hqCity: 'Singapore',
          hqPostalCode: '629351',
          hqCountry: 'Singapore',
          website: 'https://www.keppelom.com',
          notes: 'Shipyard and offshore services partner.'
        },
        {
          name: 'McDermott',
          legalName: 'McDermott International, Ltd.',
          type: 'Service Provider',
          hqAddressLine1: '757 N Eldridge Parkway',
          hqCity: 'Houston',
          hqPostalCode: '77079',
          hqCountry: 'United States',
          website: 'https://www.mcdermott.com',
          notes: 'Offshore and onshore EPC partner.'
        },
        {
          name: 'Excelerate Energy',
          legalName: 'Excelerate Energy, Inc.',
          type: 'Service Provider',
          hqAddressLine1: '2445 Technology Forest Blvd',
          hqCity: 'The Woodlands, Texas',
          hqPostalCode: '77381',
          hqCountry: 'United States',
          website: 'https://www.excelerateenergy.com',
          notes: 'FSRU owner and LNG infrastructure partner.'
        }
      ];

      for (const companyData of partnerData) {
        // Check if company already exists
        const exists = existingCompanies.find(c => c.name === companyData.name);
        if (exists) {
          results.push({
            name: companyData.name,
            status: 'skipped',
            message: 'Company already exists'
          });
          continue;
        }

        // Resolve country using alias service
        const country = await resolveCountry(companyData.hqCountry);
        if (!country) {
          results.push({
            name: companyData.name,
            status: 'error',
            message: `Country not found: ${companyData.hqCountry}`
          });
          continue;
        }

        // Create company
        try {
          await base44.entities.Company.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            name: companyData.name,
            legalName: companyData.legalName,
            type: companyData.type,
            hqAddressLine1: companyData.hqAddressLine1,
            hqCity: companyData.hqCity,
            hqPostalCode: companyData.hqPostalCode || null,
            hqCountryId: country.id,
            website: companyData.website,
            notes: companyData.notes,
            isActive: true
          });

          results.push({
            name: companyData.name,
            status: 'success',
            message: `Created as ${companyData.type} (${companyData.hqCity}, ${companyData.hqCountry})`
          });
        } catch (error) {
          results.push({
            name: companyData.name,
            status: 'error',
            message: error.message
          });
        }
      }

      return results;
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries(['companies']);
      toast.success('Nakilat partner companies seed completed');
    },
    onError: (error) => {
      toast.error('Failed to seed companies: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Nakilat Partner Companies</h1>
        <p className="text-gray-600 mt-1">
          Import 16 vessel partners and counterparties
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Import Partner Companies</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">This will create 16 companies:</p>
                <div className="space-y-2">
                  <div>
                    <p className="font-medium">Vessel Owners/Operators (6):</p>
                    <p className="text-xs">NYK Line, K Line, Teekay, SCI, International Seaways, Pronav</p>
                  </div>
                  <div>
                    <p className="font-medium">Charterers/Traders (7):</p>
                    <p className="text-xs">Shell, Glencore, ExxonMobil, Gunvor, Cheniere, Petronet LNG, Methane Services</p>
                  </div>
                  <div>
                    <p className="font-medium">Marine Services/Shipyards (3):</p>
                    <p className="text-xs">Keppel O&M, McDermott, Excelerate Energy</p>
                  </div>
                </div>
                <p className="mt-3 font-medium">Existing companies will be skipped (safe to run multiple times)</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding Companies...
              </>
            ) : (
              'Seed Nakilat Partners'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-gray-900">Results:</h3>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    result.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : result.status === 'skipped'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      result.status === 'skipped' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.name}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}