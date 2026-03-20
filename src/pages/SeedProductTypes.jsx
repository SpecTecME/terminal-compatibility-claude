import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedProductTypes() {
  const [results, setResults] = useState(null);

  const productTypesData = [
    {
      code: 'LNG',
      name: 'Liquefied Natural Gas',
      productCategory: 'GAS',
      isCryogenic: true,
      sortOrder: 1
    },
    {
      code: 'LPG',
      name: 'Liquefied Petroleum Gas',
      productCategory: 'GAS',
      isCryogenic: true,
      sortOrder: 2
    },
    {
      code: 'LNG_BUNKERING',
      name: 'LNG Bunkering',
      productCategory: 'GAS',
      isCryogenic: true,
      sortOrder: 3
    },
    {
      code: 'LIQUID_BULK',
      name: 'Liquid Bulk (Oil / Products)',
      productCategory: 'LIQUID_BULK',
      isCryogenic: false,
      sortOrder: 10
    },
    {
      code: 'CHEMICALS',
      name: 'Chemicals',
      productCategory: 'LIQUID_BULK',
      isCryogenic: false,
      sortOrder: 11
    },
    {
      code: 'DRY_BULK',
      name: 'Dry Bulk',
      productCategory: 'DRY_BULK',
      isCryogenic: false,
      sortOrder: 20
    },
    {
      code: 'CONTAINERS',
      name: 'Containers',
      productCategory: 'UNITIZED',
      isCryogenic: false,
      sortOrder: 30
    },
    {
      code: 'RORO',
      name: 'Ro-Ro',
      productCategory: 'UNITIZED',
      isCryogenic: false,
      sortOrder: 31
    },
    {
      code: 'VEHICLES',
      name: 'Vehicle Terminal (PCTC)',
      productCategory: 'UNITIZED',
      isCryogenic: false,
      sortOrder: 32
    },
    {
      code: 'OTHER',
      name: 'Other / Mixed Use',
      productCategory: 'OTHER',
      isCryogenic: false,
      sortOrder: 99
    }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const tenantId = getCurrentTenantId();
      const created = [];
      const skipped = [];
      const errors = [];

      // Check existing product types
      const existing = await base44.entities.ProductTypeRef.list();
      const existingCodes = existing.map(pt => pt.code);

      for (const pt of productTypesData) {
        try {
          if (existingCodes.includes(pt.code)) {
            skipped.push(pt.code);
            continue;
          }

          await base44.entities.ProductTypeRef.create({
            publicId: generateUUID(),
            tenantId,
            ...pt,
            isActive: true
          });
          created.push(pt.code);
        } catch (error) {
          errors.push({ code: pt.code, error: error.message });
        }
      }

      return { created, skipped, errors };
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.created.length > 0) {
        toast.success(`Successfully seeded ${data.created.length} product types`);
      }
    },
    onError: (error) => {
      toast.error('Failed to seed product types: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Product Types</h1>
        <p className="text-gray-600 mt-1">Initialize the product type reference data</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Product Types to Seed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-600">
            This will create {productTypesData.length} product type records:
          </p>
          <div className="grid md:grid-cols-2 gap-3">
            {productTypesData.map((pt) => (
              <div key={pt.code} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <Package className="w-4 h-4 text-cyan-500" />
                <div>
                  <p className="font-medium text-sm text-gray-900">{pt.code}</p>
                  <p className="text-xs text-gray-600">{pt.name}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? 'Seeding...' : 'Seed Product Types'}
          </Button>

          {results && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {results.created.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">Successfully Created</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        {results.created.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {results.skipped.length > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-amber-900">Already Exists (Skipped)</p>
                      <p className="text-sm text-amber-700 mt-1">
                        {results.skipped.join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-red-900">Errors</p>
                      {results.errors.map((err, i) => (
                        <p key={i} className="text-sm text-red-700 mt-1">
                          {err.code}: {err.error}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}