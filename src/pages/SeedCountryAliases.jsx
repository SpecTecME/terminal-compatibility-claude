import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedCountryAliases() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      const countries = await base44.entities.Country.list();
      const existingAliases = await base44.entities.CountryAlias.list();

      // Define aliases for key countries
      const aliasData = [
        {
          countryName: "United States",
          aliases: ["USA", "U.S.A.", "US", "U.S.", "United States of America", "America"]
        },
        {
          countryName: "United Kingdom",
          aliases: ["UK", "U.K.", "Great Britain", "Britain", "England"]
        },
        {
          countryName: "Korea, Republic of",
          aliases: ["South Korea", "Republic of Korea", "Korea (South)", "ROK"]
        },
        {
          countryName: "China",
          aliases: ["PRC", "People's Republic of China"]
        },
        {
          countryName: "Russian Federation",
          aliases: ["Russia"]
        },
        {
          countryName: "Iran, Islamic Republic of",
          aliases: ["Iran", "Islamic Republic of Iran"]
        }
      ];

      for (const { countryName, aliases } of aliasData) {
        const country = countries.find(c => c.nameEn === countryName);
        
        if (!country) {
          results.push({
            country: countryName,
            status: 'skipped',
            message: 'Country not found in database'
          });
          continue;
        }

        let created = 0;
        let skipped = 0;

        for (const alias of aliases) {
          // Check if alias already exists for this country
          const exists = existingAliases.some(a => 
            a.countryId === country.id && 
            a.alias.toLowerCase() === alias.toLowerCase()
          );

          if (exists) {
            skipped++;
            continue;
          }

          // Create alias
          await base44.entities.CountryAlias.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            countryId: country.id,
            countryPublicId: country.publicId,
            alias: alias,
            isActive: true
          });

          created++;
        }

        results.push({
          country: countryName,
          status: 'success',
          message: `Created ${created} aliases, skipped ${skipped} existing`
        });
      }

      return results;
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries(['countryAliases']);
      toast.success('Country aliases seeded successfully');
    },
    onError: (error) => {
      toast.error('Failed to seed aliases: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Country Aliases</h1>
        <p className="text-gray-600 mt-1">
          Create aliases for common country name variations (USA, UK, South Korea, etc.)
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Initialize Country Aliases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">This will create aliases for:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>United States → USA, US, America, etc.</li>
                  <li>United Kingdom → UK, Britain, England, etc.</li>
                  <li>Korea, Republic of → South Korea, ROK, etc.</li>
                  <li>China → PRC, People's Republic of China</li>
                  <li>Russian Federation → Russia</li>
                  <li>Iran, Islamic Republic of → Iran</li>
                </ul>
                <p className="mt-3 font-medium">Existing aliases will be skipped (safe to run multiple times)</p>
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
                Seeding Aliases...
              </>
            ) : (
              'Seed Country Aliases'
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
                      : 'bg-amber-50 border-amber-200'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.country}</p>
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