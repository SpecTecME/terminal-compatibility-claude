import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedVesselTypeCargoPolicy() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: vesselTypes = [], isLoading: loadingVesselTypes } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: cargoTypes = [], isLoading: loadingCargoTypes } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const { data: existingPolicies = [] } = useQuery({
    queryKey: ['cargoTypePolicies'],
    queryFn: () => base44.entities.VesselTypeCargoPolicy.list()
  });

  const getVesselTypeId = (primaryType, subType) => {
    const vt = vesselTypes.find(v => v.primaryType === primaryType && v.subType === subType);
    return vt?.id;
  };

  const getCargoTypeId = (code) => {
    const ct = cargoTypes.find(c => c.code === code);
    return ct?.id;
  };

  const policyData = [
    // LNG Carriers
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Small-Scale LNG', cargoCode: 'LNG', isDefault: true, capacityValue: 10000, unit: 'm3', basis: 'NOMINAL' },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Conventional LNG', cargoCode: 'LNG', isDefault: true, capacityValue: 170000, unit: 'm3', basis: 'NOMINAL' },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Q-Flex', cargoCode: 'LNG', isDefault: true, capacityValue: 210000, unit: 'm3', basis: 'NOMINAL' },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'Q-Max', cargoCode: 'LNG', isDefault: true, capacityValue: 266000, unit: 'm3', basis: 'NOMINAL' },
    
    // LNG Bunker Vessel
    { vesselPrimary: 'Gas Carrier', vesselSub: 'LNG Bunker Vessel', cargoCode: 'LNG', isDefault: true, capacityValue: 10000, unit: 'm3', basis: 'NOMINAL' },
    
    // FSRU/FSU
    { vesselPrimary: 'Gas Carrier', vesselSub: 'FSRU', cargoCode: 'LNG', isDefault: true, capacityValue: 170000, unit: 'm3', basis: 'NOMINAL' },
    { vesselPrimary: 'Gas Carrier', vesselSub: 'FSU', cargoCode: 'LNG', isDefault: true, capacityValue: 170000, unit: 'm3', basis: 'NOMINAL' },
    
    // Crude Tanker
    { vesselPrimary: 'Oil Tanker (Crude)', vesselSub: 'Aframax', cargoCode: 'CRUDE_OIL', isDefault: true, capacityValue: 100000, unit: 'MT', basis: 'NOMINAL' },
    
    // Product Tanker
    { vesselPrimary: 'Product Tanker', vesselSub: 'MR', cargoCode: 'CPP', isDefault: true, capacityValue: 45000, unit: 'MT', basis: 'NOMINAL' },
    { vesselPrimary: 'Product Tanker', vesselSub: 'MR', cargoCode: 'DPP', isDefault: false, capacityValue: 45000, unit: 'MT', basis: 'NOMINAL' },
    
    // Bulk Carrier
    { vesselPrimary: 'Bulk Carrier', vesselSub: 'Panamax', cargoCode: 'DRY_BULK', isDefault: true, capacityValue: 75000, unit: 'MT', basis: 'NOMINAL' },
    { vesselPrimary: 'Bulk Carrier', vesselSub: 'Panamax', cargoCode: 'COAL', isDefault: false },
    { vesselPrimary: 'Bulk Carrier', vesselSub: 'Panamax', cargoCode: 'GRAIN', isDefault: false },
    { vesselPrimary: 'Bulk Carrier', vesselSub: 'Panamax', cargoCode: 'IRON_ORE', isDefault: false },
    
    // Container Ship
    { vesselPrimary: 'Container Ship', vesselSub: 'Panamax', cargoCode: 'CONTAINERS', isDefault: true, capacityValue: 4500, unit: 'TEU', basis: 'NOMINAL' },
    { vesselPrimary: 'Container Ship', vesselSub: 'Panamax', cargoCode: 'REEFER_CONTAINERS', isDefault: false, capacityValue: 500, unit: 'TEU', basis: 'NOMINAL' },
    
    // Vehicle Carrier
    { vesselPrimary: 'Vehicle Carrier', vesselSub: 'PCTC', cargoCode: 'VEHICLES', isDefault: true, capacityValue: 6000, unit: 'CEU', basis: 'NOMINAL' }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const policy of policyData) {
        try {
          const vesselTypeId = getVesselTypeId(policy.vesselPrimary, policy.vesselSub);
          const cargoTypeId = getCargoTypeId(policy.cargoCode);
          
          if (!vesselTypeId) {
            results.skipped.push(`${policy.vesselPrimary}|${policy.vesselSub} (vessel type not found)`);
            continue;
          }
          
          if (!cargoTypeId) {
            results.skipped.push(`${policy.cargoCode} (cargo type not found)`);
            continue;
          }

          const exists = existingPolicies.find(p => p.vesselTypeRefId === vesselTypeId && p.cargoTypeRefId === cargoTypeId);
          if (exists) {
            results.skipped.push(`${policy.vesselSub}|${policy.cargoCode}`);
            continue;
          }

          const vesselType = vesselTypes.find(vt => vt.id === vesselTypeId);
          const cargoType = cargoTypes.find(ct => ct.id === cargoTypeId);

          await base44.entities.VesselTypeCargoPolicy.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            vesselTypeRefId: vesselTypeId,
            vesselTypeRefPublicId: vesselType?.publicId,
            cargoTypeRefId: cargoTypeId,
            cargoTypeRefPublicId: cargoType?.publicId,
            isAllowed: true,
            isDefault: policy.isDefault || false,
            defaultCapacityValue: policy.capacityValue || null,
            defaultCapacityUnit: policy.unit || null,
            capacityBasis: policy.basis || null,
            isActive: true
          });
          results.success.push(`${policy.vesselSub}|${policy.cargoCode}`);
        } catch (error) {
          results.errors.push({ code: `${policy.vesselSub}|${policy.cargoCode}`, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} policies`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} policies`);
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
        <h1 className="text-2xl font-bold text-gray-900">Seed Vessel Type Cargo Policies</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize cargo policy reference data</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Cargo Policy Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create cargo policies for vessel types including:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>LNG Carriers (Small-Scale, Conventional, Q-Flex, Q-Max, Bunker)</li>
              <li>FSRU/FSU with LNG capacity</li>
              <li>Crude Tankers (Aframax)</li>
              <li>Product Tankers (MR)</li>
              <li>Bulk Carriers (Panamax)</li>
              <li>Container Ships (Panamax)</li>
              <li>Vehicle Carriers (PCTC)</li>
            </ul>
          </div>

          {(vesselTypes.length === 0 || cargoTypes.length === 0) && !isLoading && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                Please seed Vessel Types and Cargo Types first before running this seed.
              </p>
            </div>
          )}

          {existingPolicies.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                {existingPolicies.length} policy(ies) already exist. Only missing records will be created.
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
              'Seed Cargo Policies'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}