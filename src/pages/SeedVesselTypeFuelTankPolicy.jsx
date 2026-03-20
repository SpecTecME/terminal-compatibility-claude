import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedVesselTypeFuelTankPolicy() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: vesselTypes = [] } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const { data: fuelTypes = [] } = useQuery({
    queryKey: ['fuelTypes'],
    queryFn: () => base44.entities.FuelTypeRef.list()
  });

  const { data: existingPolicies = [] } = useQuery({
    queryKey: ['fuelTankPolicies'],
    queryFn: () => base44.entities.VesselTypeFuelTankPolicy.list()
  });

  const getVesselTypeId = (primary, sub) => vesselTypes.find(vt => vt.primaryType === primary && vt.subType === sub)?.id;
  const getFuelTypeId = (code) => fuelTypes.find(ft => ft.code === code)?.id;

  const policyData = [
    // Conventional LNG
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1, notes: 'LNG fuel tank(s) for dual fuel / FGSS where applicable' },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Conventional LNG'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    
    // Q-Flex
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1, notes: 'LNG fuel tank(s) for dual fuel / FGSS where applicable' },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Flex'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    
    // Q-Max
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1, notes: 'LNG fuel tank(s) for dual fuel / FGSS where applicable' },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Q-Max'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    
    // Small-Scale LNG
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1, notes: 'LNG fuel tank(s) for dual fuel / FGSS where applicable' },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'Small-Scale LNG'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    
    // LNG Bunker Vessel
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1, notes: 'Fuel LNG tank, not cargo/bunker tanks' },
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'MGO', role: 'STORAGE', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'LNG Bunker Vessel'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: false, recCount: 0 },
    
    // FSRU
    { vType: ['Gas Carrier', 'FSRU'], fType: 'LNG', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'LNG', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'HFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'HFO', role: 'SETTLING', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSRU'], fType: 'HFO', role: 'SERVICE_DAY_TANK', isDefault: false, recCount: 0 },
    
    // FSU
    { vType: ['Gas Carrier', 'FSU'], fType: 'MGO', role: 'STORAGE', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSU'], fType: 'MGO', role: 'SERVICE_DAY_TANK', isDefault: true, recCount: 1 },
    { vType: ['Gas Carrier', 'FSU'], fType: 'VLSFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSU'], fType: 'HFO', role: 'STORAGE', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSU'], fType: 'HFO', role: 'SETTLING', isDefault: false, recCount: 0 },
    { vType: ['Gas Carrier', 'FSU'], fType: 'HFO', role: 'SERVICE_DAY_TANK', isDefault: false, recCount: 0 }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const policy of policyData) {
        try {
          const vesselTypeId = getVesselTypeId(policy.vType[0], policy.vType[1]);
          const fuelTypeId = getFuelTypeId(policy.fType);
          
          if (!vesselTypeId) {
            results.errors.push({ policy: `${policy.vType[0]} | ${policy.vType[1]}`, error: 'Vessel type not found' });
            continue;
          }
          if (!fuelTypeId) {
            results.errors.push({ policy: `${policy.vType[0]} | ${policy.vType[1]} - ${policy.fType}`, error: 'Fuel type not found' });
            continue;
          }
          
          const exists = existingPolicies.find(p => 
            p.vesselTypeRefId === vesselTypeId && 
            p.fuelTypeRefId === fuelTypeId && 
            p.tankRole === policy.role
          );
          if (exists) {
            results.skipped.push(`${policy.vType[1]} - ${policy.fType} - ${policy.role}`);
            continue;
          }

          const vesselType = vesselTypes.find(vt => vt.id === vesselTypeId);
          const fuelType = fuelTypes.find(ft => ft.id === fuelTypeId);
          
          await base44.entities.VesselTypeFuelTankPolicy.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            vesselTypeRefId: vesselTypeId,
            vesselTypeRefPublicId: vesselType?.publicId,
            fuelTypeRefId: fuelTypeId,
            fuelTypeRefPublicId: fuelType?.publicId,
            tankRole: policy.role,
            isAllowed: true,
            isDefault: policy.isDefault,
            recommendedCount: policy.recCount,
            notes: policy.notes || '',
            isActive: true
          });
          results.success.push(`${policy.vType[1]} - ${policy.fType} - ${policy.role}`);
        } catch (error) {
          results.errors.push({ policy: `${policy.vType[1]} - ${policy.fType} - ${policy.role}`, error: error.message });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Fuel Tank Policy Data</h1>
        <p className="text-sm text-gray-600 mt-1">Initialize vessel type fuel tank policy configuration</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed Policy Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create {policyData.length} fuel tank policy records for:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Conventional LNG Carriers</li>
              <li>Q-Flex and Q-Max</li>
              <li>Small-Scale LNG</li>
              <li>LNG Bunker Vessels</li>
              <li>FSRU (Floating Storage Regasification Unit)</li>
              <li>FSU (Floating Storage Unit)</li>
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
                    <span className="font-medium text-emerald-900">Successfully created {seedResults.success.length} policies</span>
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
                      <div key={idx}>{err.policy}: {err.error}</div>
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
              'Seed Fuel Tank Policies'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}