import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedProductTypesGBM() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState([]);

  const { data: existingProductTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const newProductTypes = [
    {
      code: 'GENERAL_CARGO',
      name: 'General Cargo',
      productCategory: 'OTHER',
      isCryogenic: false,
      isActive: true,
      sortOrder: 100
    },
    {
      code: 'PROJECT_BREAKBULK',
      name: 'Project & Breakbulk',
      productCategory: 'OTHER',
      isCryogenic: false,
      isActive: true,
      sortOrder: 110
    },
    {
      code: 'MULTIPURPOSE',
      name: 'Multipurpose',
      productCategory: 'OTHER',
      isCryogenic: false,
      isActive: true,
      sortOrder: 120
    }
  ];

  const handleSeed = async () => {
    setIsSeeding(true);
    setResults([]);
    const newResults = [];

    for (const pt of newProductTypes) {
      const exists = existingProductTypes.find(e => e.code === pt.code);
      if (exists) {
        newResults.push({ name: pt.name, status: 'skipped', message: 'Already exists' });
      } else {
        try {
          await base44.entities.ProductTypeRef.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            ...pt
          });
          newResults.push({ name: pt.name, status: 'success', message: 'Created' });
        } catch (error) {
          newResults.push({ name: pt.name, status: 'error', message: error.message });
        }
      }
    }

    setResults(newResults);
    setIsSeeding(false);
    const successCount = newResults.filter(r => r.status === 'success').length;
    if (successCount > 0) {
      toast.success(`Created ${successCount} product type(s)`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Product Types (GBM)</h1>
        <p className="text-gray-600 mt-1">Ensure General Cargo, Project & Breakbulk, and Multipurpose product types exist</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Product Types to Add</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {newProductTypes.map((pt, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-cyan-500" />
                  <div>
                    <p className="font-medium text-gray-900">{pt.name}</p>
                    <p className="text-xs text-gray-600">Code: {pt.code}</p>
                  </div>
                </div>
                {results.find(r => r.name === pt.name) && (
                  <div className="flex items-center gap-2">
                    {results.find(r => r.name === pt.name).status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {results.find(r => r.name === pt.name).status === 'skipped' && (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    {results.find(r => r.name === pt.name).status === 'error' && (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-sm text-gray-600">
                      {results.find(r => r.name === pt.name).message}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleSeed}
              disabled={isSeeding}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {isSeeding ? 'Seeding...' : 'Seed Product Types'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}