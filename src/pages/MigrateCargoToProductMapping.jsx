import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GitBranch, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateCargoToProductMapping() {
  const [isMigrating, setIsMigrating] = useState(false);
  const [results, setResults] = useState([]);

  const { data: cargoTypes = [] } = useQuery({
    queryKey: ['cargoTypes'],
    queryFn: () => base44.entities.CargoTypeRef.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const mappingRules = {
    'LNG': 'LNG',
    'LPG_PROPANE': 'LPG',
    'LPG_BUTANE': 'LPG',
    'LPG_MIXED': 'LPG',
    'ETHANE': 'LPG',
    'CRUDE_OIL': 'LIQUID_BULK',
    'CPP': 'LIQUID_BULK',
    'DPP': 'LIQUID_BULK',
    'CHEMICALS': 'CHEMICALS',
    'CONTAINERS': 'CONTAINERS',
    'REEFER_CONTAINERS': 'CONTAINERS',
    'DRY_BULK': 'DRY_BULK',
    'COAL': 'DRY_BULK',
    'GRAIN': 'DRY_BULK',
    'IRON_ORE': 'DRY_BULK',
    'VEHICLES': 'VEHICLES',
    'RORO_LANE': 'RORO',
    'GENERAL_CARGO': 'GENERAL_CARGO',
    'BREAKBULK': 'PROJECT_BREAKBULK',
    // PASSENGERS intentionally omitted - stays NULL
  };

  const handleMigrate = async () => {
    setIsMigrating(true);
    setResults([]);
    const newResults = [];

    for (const cargo of cargoTypes) {
      const targetProductCode = mappingRules[cargo.code];
      
      if (!targetProductCode) {
        // Not in mapping rules - leave NULL (including PASSENGERS)
        newResults.push({ 
          cargo: cargo.name, 
          status: 'skipped', 
          message: 'No mapping (intentionally left N/A)' 
        });
        continue;
      }

      const targetProduct = productTypes.find(pt => pt.code === targetProductCode);
      
      if (!targetProduct) {
        newResults.push({ 
          cargo: cargo.name, 
          status: 'error', 
          message: `Product type ${targetProductCode} not found` 
        });
        continue;
      }

      if (cargo.productTypeId === targetProduct.id) {
        newResults.push({ 
          cargo: cargo.name, 
          status: 'skipped', 
          message: 'Already mapped' 
        });
        continue;
      }

      try {
        await base44.entities.CargoTypeRef.update(cargo.id, {
          productTypeId: targetProduct.id,
          productTypePublicId: targetProduct.publicId
        });
        newResults.push({ 
          cargo: cargo.name, 
          status: 'success', 
          message: `Mapped to ${targetProduct.name}` 
        });
      } catch (error) {
        newResults.push({ 
          cargo: cargo.name, 
          status: 'error', 
          message: error.message 
        });
      }
    }

    setResults(newResults);
    setIsMigrating(false);
    
    const successCount = newResults.filter(r => r.status === 'success').length;
    if (successCount > 0) {
      toast.success(`Migrated ${successCount} cargo type mapping(s)`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Cargo → Product Type Mapping</h1>
        <p className="text-gray-600 mt-1">Populate productTypeId for existing cargo types (passengers remain NULL)</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Migration Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Important:</strong> Passenger-related cargo types will remain unmapped (N/A) as per business rules.
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {cargoTypes.map((cargo, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{cargo.name}</p>
                    <p className="text-xs text-gray-600">Code: {cargo.code}</p>
                  </div>
                </div>
                {results.find(r => r.cargo === cargo.name) && (
                  <div className="flex items-center gap-2">
                    {results.find(r => r.cargo === cargo.name).status === 'success' && (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    )}
                    {results.find(r => r.cargo === cargo.name).status === 'skipped' && (
                      <AlertCircle className="w-4 h-4 text-gray-400" />
                    )}
                    {results.find(r => r.cargo === cargo.name).status === 'error' && (
                      <XCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="text-xs text-gray-600">
                      {results.find(r => r.cargo === cargo.name).message}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Button
              onClick={handleMigrate}
              disabled={isMigrating || cargoTypes.length === 0 || productTypes.length === 0}
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {isMigrating ? 'Migrating...' : 'Run Migration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}