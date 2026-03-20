import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedVesselTypeFSRUFSU() {
  const [seedResults, setSeedResults] = useState(null);

  const { data: existingTypes = [] } = useQuery({
    queryKey: ['vesselTypes'],
    queryFn: () => base44.entities.VesselTypeRef.list()
  });

  const seedData = [
    {
      primaryType: 'Gas Carrier',
      subType: 'FSRU',
      sizeMetric: 'm3',
      typicalSizeRange: 'Varies',
      definingCharacteristics: 'Floating storage and regasification unit',
      capabilitiesSections: 'LNG Cargo System Capability, Transfer Modes',
      sortOrder: 50
    },
    {
      primaryType: 'Gas Carrier',
      subType: 'FSU',
      sizeMetric: 'm3',
      typicalSizeRange: 'Varies',
      definingCharacteristics: 'Floating storage unit (no regas)',
      capabilitiesSections: 'LNG Cargo System Capability, Transfer Modes',
      sortOrder: 51
    }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = { success: [], skipped: [], errors: [] };
      
      for (const vesselType of seedData) {
        try {
          const exists = existingTypes.find(vt => 
            vt.primaryType === vesselType.primaryType && vt.subType === vesselType.subType
          );
          if (exists) {
            results.skipped.push(`${vesselType.primaryType} | ${vesselType.subType}`);
            continue;
          }

          await base44.entities.VesselTypeRef.create({
            ...vesselType,
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            isActive: true
          });
          results.success.push(`${vesselType.primaryType} | ${vesselType.subType}`);
        } catch (error) {
          results.errors.push({ 
            type: `${vesselType.primaryType} | ${vesselType.subType}`, 
            error: error.message 
          });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      setSeedResults(results);
      if (results.success.length > 0) {
        toast.success(`Successfully seeded ${results.success.length} vessel types`);
      }
      if (results.errors.length > 0) {
        toast.error(`Failed to seed ${results.errors.length} vessel types`);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed FSRU/FSU Vessel Types</h1>
        <p className="text-sm text-gray-600 mt-1">Add FSRU and FSU to VesselTypeRef</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Seed FSRU/FSU Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-sm text-gray-600">
            <p>This will create 2 vessel type records:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              {seedData.map(vt => (
                <li key={vt.subType}>{vt.primaryType} | {vt.subType} - {vt.definingCharacteristics}</li>
              ))}
            </ul>
          </div>

          {existingTypes.some(vt => vt.primaryType === 'Gas Carrier' && ['FSRU', 'FSU'].includes(vt.subType)) && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Some FSRU/FSU types already exist. Only missing records will be created.
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
                      <div key={idx}>{err.type}: {err.error}</div>
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
              'Seed FSRU/FSU Types'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}