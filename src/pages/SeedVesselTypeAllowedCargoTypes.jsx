import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedVesselTypeAllowedCargoTypes() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: vesselTypes = [], isLoading: loadingVesselTypes } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: cargoTypes = [], isLoading: loadingCargoTypes } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const { data: existingRecords = [] } = useQuery({
    queryKey: ['allowedCargoTypes'],
    queryFn: () => base44.entities.VesselTypeAllowedCargoType.list()
  });

  const getVesselTypeId = (primaryType, subType) => {
    const vt = vesselTypes.find(v => v.primaryType === primaryType && v.subType === subType);
    return vt?.id;
  };

  const getCargoTypeId = (code) => {
    const ct = cargoTypes.find(c => c.code === code);
    return ct?.id;
  };

  const allowedData = [
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Small-Scale LNG', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Conventional LNG', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Q-Flex', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Q-Max', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'LNG Bunker Vessel', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'FSRU', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'FSU', cargoCodes: ['LNG'] },
    { vesselPrimary: 'Oil Tanker (Crude)', vesselSub: 'Aframax', cargoCodes: ['CRUDE_OIL'] },
    { vesselPrimary: 'Product Tanker', vesselSub: 'MR', cargoCodes: ['CPP', 'DPP'] },
    { vesselPrimary: 'Bulk Carrier', vesselSub: 'Panamax', cargoCodes: ['DRY_BULK', 'COAL', 'GRAIN', 'IRON_ORE'] },
    { vesselPrimary: 'Container Ship', vesselSub: 'Panamax', cargoCodes: ['CONTAINERS', 'REEFER_CONTAINERS'] },
    { vesselPrimary: 'Vehicle Carrier', vesselSub: 'PCTC', cargoCodes: ['VEHICLES'] }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const mapping of allowedData) {
        const vesselTypeId = getVesselTypeId(mapping.vesselPrimary, mapping.vesselSub);
        
        if (!vesselTypeId) {
          results.skipped.push(`${mapping.vesselPrimary}|${mapping.vesselSub} (vessel type not found)`);
          continue;
        }

        for (const cargoCode of mapping.cargoCodes) {
          try {
            const cargoTypeId = getCargoTypeId(cargoCode);
            
            if (!cargoTypeId) {
              results.skipped.push(`${cargoCode} (cargo type not found)`);
              continue;
            }

            const exists = existingRecords.find(r => r.vesselTypeRefId === vesselTypeId && r.cargoTypeRefId === cargoTypeId);
            if (exists) {
              results.skipped.push(`${mapping.vesselSub}|${cargoCode}`);
              continue;
            }

            const vesselType = vesselTypes.find(vt => vt.id === vesselTypeId);
            const cargoType = cargoTypes.find(ct => ct.id === cargoTypeId);

            await base44.entities.VesselTypeAllowedCargoType.create({
              publicId: crypto.randomUUID(),
              tenantId: 'default-tenant',
              vesselTypeRefId: vesselTypeId,
              vesselTypeRefPublicId: vesselType?.publicId,
              cargoTypeRefId: cargoTypeId,
              cargoTypeRefPublicId: cargoType?.publicId,
              isAllowed: true,
              isActive: true
            });
            results.success.push(`${mapping.vesselSub}|${cargoCode}`);
          } catch (error) {
            results.errors.push({ code: `${mapping.vesselSub}|${cargoCode}`, error: error.message });
          }
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} records`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} records`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  const isLoading = loadingVesselTypes || loadingCargoTypes;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Vessel Type Allowed Cargo Types</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize allowed cargo type mappings</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Allowed Cargo Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create allowed cargo type mappings for vessel types</p>
          </div>

          {(vesselTypes.length === 0 || cargoTypes.length === 0) && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Please seed Vessel Types and Cargo Types first before running this seed.
              </p>
            </div>
          )}

          {existingRecords.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {existingRecords.length} record(s) already exist. Only missing records will be created.
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
                    <span className="font-medium text-gray-900">Skipped:</span>
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
            disabled={seedMutation.isPending || isLoading || vesselTypes.length === 0 || cargoTypes.length === 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Allowed Cargo Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}