import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedFuelTypes() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: existingFuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: () => base44.entities.FuelTypeRef.list()
  });

  const seedData = [
    { code: 'LNG', name: 'Liquefied Natural Gas (LNG)', category: 'GAS', heatingRequired: false, isCryogenic: true, sortOrder: 1 },
    { code: 'MGO', name: 'Marine Gas Oil (MGO)', category: 'DISTILLATE', heatingRequired: false, isCryogenic: false, sortOrder: 2 },
    { code: 'LSMGO', name: 'Low Sulphur Marine Gas Oil (LSMGO)', category: 'DISTILLATE', heatingRequired: false, isCryogenic: false, sortOrder: 3 },
    { code: 'VLSFO', name: 'Very Low Sulphur Fuel Oil (VLSFO)', category: 'RESIDUAL', heatingRequired: true, isCryogenic: false, sortOrder: 4 },
    { code: 'HFO', name: 'Heavy Fuel Oil (HFO)', category: 'RESIDUAL', heatingRequired: true, isCryogenic: false, sortOrder: 5 },
    { code: 'METHANOL', name: 'Methanol', category: 'ALCOHOL', heatingRequired: false, isCryogenic: false, sortOrder: 6 },
    { code: 'LPG', name: 'Liquefied Petroleum Gas (LPG)', category: 'GAS', heatingRequired: false, isCryogenic: false, sortOrder: 7 },
    { code: 'OTHER', name: 'Other', category: 'OTHER', heatingRequired: false, isCryogenic: false, sortOrder: 99 }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const fuel of seedData) {
        try {
          const exists = existingFuelTypes.find(ft => ft.code === fuel.code);
          if (exists) {
            results.skipped.push(fuel.code);
            continue;
          }

          await base44.entities.FuelTypeRef.create({
            ...fuel,
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            isActive: true
          });
          results.success.push(fuel.code);
        } catch (error) {
          results.errors.push({ code: fuel.code, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} fuel types`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} fuel types`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Fuel Types</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize fuel type reference data</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Fuel Type Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create {seedData.length} fuel type records:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {seedData.map(fuel => (
                <li key={fuel.code}>{fuel.code} - {fuel.name}</li>
              ))}
            </ul>
          </div>

          {existingFuelTypes.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {existingFuelTypes.length} fuel type(s) already exist. Only missing records will be created.
              </p>
            </div>
          )}

          {seedResults && (
            <div className="space-y-3">
              {seedResults.success.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Successfully created:</span>
                  </div>
                  <p className="text-sm text-emerald-800">{seedResults.success.join(', ')}</p>
                </div>
              )}
              {seedResults.skipped.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Skipped (already exist):</span>
                  </div>
                  <p className="text-sm text-gray-700">{seedResults.skipped.join(', ')}</p>
                </div>
              )}
              {seedResults.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Errors:</span>
                  </div>
                  <div className="text-sm text-red-800 space-y-1">
                    {seedResults.errors.map((err, idx) => (
                      <div key={idx}>{err.code}: {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Fuel Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}