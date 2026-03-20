import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedVesselTypeAllowedFuelTypes() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: vesselTypes = [] } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: () => base44.entities.FuelTypeRef.list()
  });

  const { data: existingRecords = [] } = useQuery({
    queryKey: ['allowedFuelTypes'],
    queryFn: () => base44.entities.VesselTypeAllowedFuelType.list()
  });

  const getVesselTypeId = (primary, sub) => vesselTypes.find(vt => vt.primaryType === primary && vt.subType === sub)?.id;
  const getFuelTypeId = (code) => fuelTypes.find(ft => ft.code === code)?.id;

  const allowedFuelData = [
    // Gas Carrier | Conventional LNG
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'VLSFO' },
    
    // Gas Carrier | Q-Flex
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'VLSFO' },
    
    // Gas Carrier | Q-Max
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'VLSFO' },
    
    // Gas Carrier | Small-Scale LNG
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'VLSFO' },
    
    // Gas Carrier | LNG Bunker Vessel
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'MGO' },
    
    // Gas Carrier | FSRU
    { vType: ['Gas Carrier', 'FSRU'], fType: 'LNG' },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'VLSFO' },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'HFO' },
    
    // Gas Carrier | FSU
    { vType: ['Gas Carrier', 'FSU'], fType: 'MGO' },
    { vType: ['Gas Carrier', 'FSU'], fType: 'VLSFO' },
    { vType: ['Gas Carrier', 'FSU'], fType: 'HFO' }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const mapping of allowedFuelData) {
        try {
          const vesselTypeId = getVesselTypeId(mapping.vType[0], mapping.vType[1]);
          const fuelTypeId = getFuelTypeId(mapping.fType);
          
          if (!vesselTypeId) {
            results.errors.push({ mapping: `${mapping.vType[0]} | ${mapping.vType[1]}`, error: 'Vessel type not found' });
            continue;
          }
          if (!fuelTypeId) {
            results.errors.push({ mapping: `${mapping.vType[0]} | ${mapping.vType[1]} - ${mapping.fType}`, error: 'Fuel type not found' });
            continue;
          }
          
          const exists = existingRecords.find(r => 
            r.vesselTypeRefId === vesselTypeId && 
            r.fuelTypeRefId === fuelTypeId
          );
          if (exists) {
            results.skipped.push(`${mapping.vType[1]} - ${mapping.fType}`);
            continue;
          }

          const vesselType = vesselTypes.find(vt => vt.id === vesselTypeId);
          const fuelType = fuelTypes.find(ft => ft.id === fuelTypeId);
          
          await base44.entities.VesselTypeAllowedFuelType.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            vesselTypeRefId: vesselTypeId,
            vesselTypeRefPublicId: vesselType?.publicId,
            fuelTypeRefId: fuelTypeId,
            fuelTypeRefPublicId: fuelType?.publicId,
            isAllowed: true,
            isActive: true
          });
          results.success.push(`${mapping.vType[1]} - ${mapping.fType}`);
        } catch (error) {
          results.errors.push({ mapping: `${mapping.vType[1]} - ${mapping.fType}`, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} allowed fuel types`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} records`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Vessel Type Allowed Fuel Types</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize allowed fuel type mappings</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Allowed Fuel Types Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create {allowedFuelData.length} allowed fuel type mappings for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Conventional LNG: LNG, MGO, VLSFO</li>
              <li>Q-Flex: LNG, MGO, VLSFO</li>
              <li>Q-Max: LNG, MGO, VLSFO</li>
              <li>Small-Scale LNG: LNG, MGO, VLSFO</li>
              <li>LNG Bunker Vessel: LNG, MGO</li>
              <li>FSRU: LNG, MGO, VLSFO, HFO</li>
              <li>FSU: MGO, VLSFO, HFO</li>
            </ul>
          </div>

          {vesselTypes.length === 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">⚠️ No vessel types found. Please seed vessel types first.</p>
            </div>
          )}

          {fuelTypes.length === 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">⚠️ No fuel types found. Please seed fuel types first.</p>
            </div>
          )}

          {seedResults && (
            <div className="space-y-3">
              {seedResults.success.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-emerald-900">Successfully created {seedResults.success.length} mappings</span>
                  </div>
                </div>
              )}
              {seedResults.skipped.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">Skipped {seedResults.skipped.length} (already exist)</span>
                  </div>
                </div>
              )}
              {seedResults.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="font-medium text-red-900">Errors:</span>
                  </div>
                  <div className="text-sm text-red-800 space-y-1 max-h-48 overflow-auto">
                    {seedResults.errors.map((err, idx) => (
                      <div key={idx}>{err.mapping}: {err.error}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending || vesselTypes.length === 0 || fuelTypes.length === 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Allowed Fuel Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}