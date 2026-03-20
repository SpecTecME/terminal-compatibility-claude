import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { resolveCountry } from '../components/services/countryAliasService';

export default function SeedIACSCompanies() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      const existingCompanies = await base44.entities.Company.list();

      // Define IACS member companies
      const iacsData = [
        {
          name: 'DNV',
          legalName: 'DNV',
          hqAddressLine1: 'Veritasveien 1',
          hqCity: 'Høvik (Oslo HQ)',
          hqPostalCode: '1363',
          hqCountry: 'Norway',
          phone: '+47 6757 9900',
          email: '',
          website: 'https://www.dnv.com',
          notes: 'Main HQ, Oslo area (Høvik).'
        },
        {
          name: 'ABS',
          legalName: 'American Bureau of Shipping',
          hqAddressLine1: '1701 City Plaza Drive, Spring, TX',
          hqCity: 'Spring (Houston area)',
          hqPostalCode: '77389',
          hqCountry: 'United States',
          phone: '+1 281 877 6000',
          email: '',
          website: 'https://ww2.eagle.org',
          notes: 'ABS World Headquarters.'
        },
        {
          name: "Lloyd's Register",
          legalName: "Lloyd's Register Group Services Limited (registered office)",
          hqAddressLine1: '71 Fenchurch Street',
          hqCity: 'London',
          hqPostalCode: 'EC3M 4BS',
          hqCountry: 'United Kingdom',
          phone: '',
          email: '',
          website: 'https://www.lr.org',
          notes: 'Registered office address used as HQ reference.'
        },
        {
          name: 'ClassNK',
          legalName: 'Nippon Kaiji Kyokai',
          hqAddressLine1: '4-7, Kioi-cho, Chiyoda-ku',
          hqCity: 'Tokyo',
          hqPostalCode: '102-8567',
          hqCountry: 'Japan',
          phone: '+81 3 3230 1201',
          email: '',
          website: 'https://www.classnk.or.jp',
          notes: 'Head Office, Administration Center.'
        },
        {
          name: 'Bureau Veritas',
          legalName: 'Bureau Veritas Marine & Offshore, SAS (registered office)',
          hqAddressLine1: 'Tour Alto, 4 Place des Saisons',
          hqCity: 'Courbevoie',
          hqPostalCode: '92400',
          hqCountry: 'France',
          phone: '+33 1 55 24 70 00',
          email: '',
          website: 'https://marine-offshore.bureauveritas.com',
          notes: 'Registered office for BV Marine & Offshore website publisher.'
        },
        {
          name: 'RINA',
          legalName: 'RINA S.p.A.',
          hqAddressLine1: 'Via Corsica, 12',
          hqCity: 'Genova',
          hqPostalCode: '16128',
          hqCountry: 'Italy',
          phone: '+39 010 53851',
          email: '',
          website: 'https://www.rina.org',
          notes: 'Head office.'
        },
        {
          name: 'CCS',
          legalName: 'China Classification Society',
          hqAddressLine1: 'CCS Mansion, 9 Dongzhimen Nan Da Jie',
          hqCity: 'Beijing',
          hqPostalCode: '100007',
          hqCountry: 'China',
          phone: '+86 10 58112288',
          email: 'ccs@ccs.org.cn',
          website: 'https://www.ccs.org.cn',
          notes: 'Headquarters contact details.'
        },
        {
          name: 'KR',
          legalName: 'Korean Register',
          hqAddressLine1: '36, Myeongji ocean city 9-ro, Gangseo-gu',
          hqCity: 'Busan',
          hqPostalCode: '46762',
          hqCountry: 'Republic of Korea',
          phone: '',
          email: '',
          website: 'https://www.krs.co.kr/eng/',
          notes: 'Address shown on KR site footer.'
        },
        {
          name: 'IRS (IRClass)',
          legalName: 'Indian Register of Shipping',
          hqAddressLine1: '52A, Adi Shankaracharya Marg, Opp. Powai Lake, Powai',
          hqCity: 'Mumbai',
          hqPostalCode: '400 072',
          hqCountry: 'India',
          phone: '+91 22 3051 9400',
          email: 'ho@irclass.org',
          website: 'https://www.irclass.org',
          notes: 'Head Office listing on IRClass site.'
        },
        {
          name: 'CRS',
          legalName: 'Croatian Register of Shipping',
          hqAddressLine1: 'Marasovića 67',
          hqCity: 'Split',
          hqPostalCode: '21000',
          hqCountry: 'Croatia',
          phone: '+385 21 408 111',
          email: 'info@crs.hr',
          website: 'https://www.crs.hr',
          notes: 'CRS Head Office contact page.'
        },
        {
          name: 'PRS',
          legalName: 'Polski Rejestr Statków S.A. (Polish Register of Shipping)',
          hqAddressLine1: 'al. gen. Józefa Hallera 126',
          hqCity: 'Gdańsk',
          hqPostalCode: '80-416',
          hqCountry: 'Poland',
          phone: '+48 58 346 17 00',
          email: 'mailbox@prs.pl',
          website: 'https://prs.pl',
          notes: 'PRS head office contact page.'
        }
      ];

      for (const companyData of iacsData) {
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
            type: 'Authority',
            iacsMember: true,
            hqAddressLine1: companyData.hqAddressLine1,
            hqCity: companyData.hqCity,
            hqPostalCode: companyData.hqPostalCode,
            hqCountryId: country.id,
            phone: companyData.phone || null,
            email: companyData.email || null,
            website: companyData.website,
            notes: companyData.notes,
            isActive: true
          });

          results.push({
            name: companyData.name,
            status: 'success',
            message: `Created successfully (HQ: ${companyData.hqCity}, ${companyData.hqCountry})`
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
      toast.success('IACS companies seed completed');
    },
    onError: (error) => {
      toast.error('Failed to seed companies: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed IACS Classification Societies</h1>
        <p className="text-gray-600 mt-1">
          Import 11 IACS member classification society headquarters
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Import IACS Members</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">This will create 11 companies:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>DNV (Norway)</li>
                  <li>ABS (United States)</li>
                  <li>Lloyd's Register (United Kingdom)</li>
                  <li>ClassNK (Japan)</li>
                  <li>Bureau Veritas (France)</li>
                  <li>RINA (Italy)</li>
                  <li>CCS (China)</li>
                  <li>KR (Republic of Korea)</li>
                  <li>IRS/IRClass (India)</li>
                  <li>CRS (Croatia)</li>
                  <li>PRS (Poland)</li>
                </ul>
                <p className="mt-3 font-medium">All marked as Authority type with iacsMember = true</p>
                <p className="mt-1">Existing companies will be skipped (safe to run multiple times)</p>
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
              'Seed IACS Companies'
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