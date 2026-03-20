import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedCargoTypes() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: existingCargoTypes = [] } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const seedData = [
    // GAS / LIQUID GAS
    { code: 'LNG', name: 'Liquefied Natural Gas (LNG)', cargoCategory: 'GAS', defaultUnit: 'm3', sortOrder: 1 },
    { code: 'LPG_PROPANE', name: 'LPG - Propane', cargoCategory: 'GAS', defaultUnit: 'm3', sortOrder: 2 },
    { code: 'LPG_BUTANE', name: 'LPG - Butane', cargoCategory: 'GAS', defaultUnit: 'm3', sortOrder: 3 },
    { code: 'LPG_MIXED', name: 'LPG - Mixed', cargoCategory: 'GAS', defaultUnit: 'm3', sortOrder: 4 },
    { code: 'ETHANE', name: 'Ethane', cargoCategory: 'GAS', defaultUnit: 'm3', sortOrder: 5 },
    
    // LIQUID BULK
    { code: 'CRUDE_OIL', name: 'Crude Oil', cargoCategory: 'LIQUID_BULK', defaultUnit: 'MT', sortOrder: 10 },
    { code: 'CPP', name: 'Clean Petroleum Products (CPP)', cargoCategory: 'LIQUID_BULK', defaultUnit: 'MT', sortOrder: 11 },
    { code: 'DPP', name: 'Dirty Petroleum Products (DPP)', cargoCategory: 'LIQUID_BULK', defaultUnit: 'MT', sortOrder: 12 },
    { code: 'CHEMICALS', name: 'Chemicals (Liquid Bulk)', cargoCategory: 'LIQUID_BULK', defaultUnit: 'MT', sortOrder: 13 },
    
    // DRY BULK / GENERAL
    { code: 'DRY_BULK', name: 'Dry Bulk (Generic)', cargoCategory: 'DRY_BULK', defaultUnit: 'MT', sortOrder: 20 },
    { code: 'COAL', name: 'Coal', cargoCategory: 'DRY_BULK', defaultUnit: 'MT', sortOrder: 21 },
    { code: 'IRON_ORE', name: 'Iron Ore', cargoCategory: 'DRY_BULK', defaultUnit: 'MT', sortOrder: 22 },
    { code: 'GRAIN', name: 'Grain', cargoCategory: 'DRY_BULK', defaultUnit: 'MT', sortOrder: 23 },
    { code: 'BREAKBULK', name: 'Breakbulk / Project Cargo', cargoCategory: 'GENERAL', defaultUnit: 'MT', sortOrder: 24 },
    { code: 'GENERAL_CARGO', name: 'General Cargo', cargoCategory: 'GENERAL', defaultUnit: 'MT', sortOrder: 25 },
    
    // CONTAINER / RORO / PASSENGER
    { code: 'CONTAINERS', name: 'Containers', cargoCategory: 'CONTAINER', defaultUnit: 'TEU', sortOrder: 30 },
    { code: 'REEFER_CONTAINERS', name: 'Reefer Containers', cargoCategory: 'CONTAINER', defaultUnit: 'TEU', sortOrder: 31 },
    { code: 'VEHICLES', name: 'Vehicles', cargoCategory: 'RORO', defaultUnit: 'CEU', sortOrder: 32 },
    { code: 'RORO_LANE', name: 'Ro-Ro (Lane Meters)', cargoCategory: 'RORO', defaultUnit: 'lane_meters', sortOrder: 33 },
    { code: 'PASSENGERS', name: 'Passengers', cargoCategory: 'PASSENGER', defaultUnit: 'pax', sortOrder: 34 }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const cargo of seedData) {
        try {
          const exists = existingCargoTypes.find(ct => ct.code === cargo.code);
          if (exists) {
            results.skipped.push(cargo.code);
            continue;
          }

          await base44.entities.CargoTypeRef.create({
            ...cargo,
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            isActive: true
          });
          results.success.push(cargo.code);
        } catch (error) {
          results.errors.push({ code: cargo.code, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} cargo types`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} cargo types`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Cargo Types</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize cargo type reference data</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Cargo Type Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create {seedData.length} cargo type records covering:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Gas (LNG, LPG variants, Ethane)</li>
              <li>Liquid Bulk (Crude Oil, CPP, DPP, Chemicals)</li>
              <li>Dry Bulk (Coal, Iron Ore, Grain, etc.)</li>
              <li>Containers (Standard, Reefer)</li>
              <li>Ro-Ro (Vehicles, Lane Meters)</li>
              <li>Passengers</li>
            </ul>
          </div>

          {existingCargoTypes.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {existingCargoTypes.length} cargo type(s) already exist. Only missing records will be created.
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
              'Seed Cargo Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}