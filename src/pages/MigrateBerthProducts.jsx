import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Anchor, CheckCircle, AlertCircle, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MigrateBerthProducts() {
  const [migrationResult, setMigrationResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const { data: berths = [], isLoading: berthsLoading } = useQuery({
    queryKey: ['berths'],
    queryFn: () => base44.entities.Berth.list()
  });

  const { data: productTypes = [], isLoading: productTypesLoading } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const isLoading = berthsLoading || productTypesLoading;

  const berthsNeedingMigration = berths.filter(b => 
    b.productService && (!b.productTypeRefIds || b.productTypeRefIds.length === 0)
  );

  // Ensure required ProductTypeRef records exist
  const ensureProductTypes = async () => {
    const requiredProducts = ['LNG', 'LPG', 'Condensate', 'Other'];
    const existingCodes = productTypes.map(pt => pt.code);
    
    for (const code of requiredProducts) {
      if (!existingCodes.includes(code)) {
        await base44.entities.ProductTypeRef.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          code: code,
          name: code,
          productCategory: 'GAS',
          isActive: true,
          sortOrder: requiredProducts.indexOf(code) + 1
        });
      }
    }
  };

  const parseProductService = (productService) => {
    if (!productService) return [];
    // Split by comma, dash, or other common separators
    return productService
      .split(/[,\-\/]/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  };

  const runMigration = async () => {
    setIsRunning(true);
    const results = {
      total: 0,
      migrated: 0,
      skipped: 0,
      failed: [],
      details: []
    };

    try {
      // First ensure product types exist
      await ensureProductTypes();
      
      // Refresh product types after ensuring they exist
      const updatedProductTypes = await base44.entities.ProductTypeRef.list();

      for (const berth of berths) {
        results.total++;

        // Skip if already has products relationship or no legacy data
        if (berth.productTypeRefIds && berth.productTypeRefIds.length > 0) {
          results.skipped++;
          continue;
        }

        if (!berth.productService) {
          results.skipped++;
          continue;
        }

        // Parse legacy productService field
        const productNames = parseProductService(berth.productService);
        const productTypeRefIds = [];

        for (const name of productNames) {
          const productType = updatedProductTypes.find(pt => 
            pt.code?.toUpperCase() === name.toUpperCase() || 
            pt.name?.toUpperCase() === name.toUpperCase()
          );
          
          if (productType) {
            productTypeRefIds.push(productType.id);
          }
        }

        if (productTypeRefIds.length > 0) {
          await base44.entities.Berth.update(berth.id, {
            productTypeRefIds: productTypeRefIds
          });
          results.migrated++;
          results.details.push({
            berthName: berth.berthName || berth.berth_name || berth.berth_number,
            legacy: berth.productService,
            migrated: productNames.join(', ')
          });
        } else {
          results.failed.push({
            berthName: berth.berthName || berth.berth_name || berth.berth_number,
            legacy: berth.productService,
            reason: 'Could not match any products'
          });
        }
      }

      setMigrationResult(results);
      toast.success('Migration completed');
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Berth Products</h1>
        <p className="text-gray-600 mt-1">Convert legacy Product Services enum to ProductTypeRef relationships</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Anchor className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Berths</p>
                <p className="text-2xl font-semibold text-gray-900">{berths.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Needs Migration</p>
                <p className="text-2xl font-semibold text-gray-900">{berthsNeedingMigration.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Product Types</p>
                <p className="text-2xl font-semibold text-gray-900">{productTypes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Migration Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-700">
              This migration will convert the legacy "Product Services" enum field to ProductTypeRef relationships.
            </p>
            <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>Creates missing ProductTypeRef records (LNG, LPG, Condensate, Other)</li>
              <li>Parses legacy productService text values</li>
              <li>Maps to ProductTypeRef records and sets productTypeRefIds</li>
              <li>Preserves legacy field for reference</li>
              <li>Safe to run multiple times (idempotent)</li>
            </ul>
          </div>

          <Button 
            onClick={runMigration}
            disabled={isRunning || berthsNeedingMigration.length === 0}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Migration...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Run Migration ({berthsNeedingMigration.length} berths)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {migrationResult && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Migration Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                <p className="text-sm text-blue-600 font-medium">Total Processed</p>
                <p className="text-2xl font-bold text-blue-900">{migrationResult.total}</p>
              </div>
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-sm text-emerald-600 font-medium">Migrated</p>
                <p className="text-2xl font-bold text-emerald-900">{migrationResult.migrated}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-sm text-slate-600 font-medium">Skipped</p>
                <p className="text-2xl font-bold text-slate-900">{migrationResult.skipped}</p>
              </div>
            </div>

            {migrationResult.details.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  Successfully Migrated ({migrationResult.details.length})
                </h3>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Berth</TableHead>
                        <TableHead>Legacy Value</TableHead>
                        <TableHead>Migrated To</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResult.details.slice(0, 10).map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.berthName}</TableCell>
                          <TableCell className="text-gray-600">{item.legacy}</TableCell>
                          <TableCell className="text-emerald-700">{item.migrated}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {migrationResult.details.length > 10 && (
                    <p className="text-xs text-emerald-700 mt-2">...and {migrationResult.details.length - 10} more</p>
                  )}
                </div>
              </div>
            )}

            {migrationResult.failed.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  Failed to Migrate ({migrationResult.failed.length})
                </h3>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Berth</TableHead>
                        <TableHead>Legacy Value</TableHead>
                        <TableHead>Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {migrationResult.failed.map((item, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">{item.berthName}</TableCell>
                          <TableCell>{item.legacy}</TableCell>
                          <TableCell className="text-amber-700">{item.reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Berths Needing Migration</CardTitle>
        </CardHeader>
        <CardContent>
          {berthsNeedingMigration.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-emerald-400" />
              <p>All berths have been migrated to ProductTypeRef</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200">
                  <TableHead className="text-gray-600">Berth</TableHead>
                  <TableHead className="text-gray-600">Terminal</TableHead>
                  <TableHead className="text-gray-600">Legacy Product Services</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {berthsNeedingMigration.slice(0, 20).map((berth) => (
                  <TableRow key={berth.id} className="border-gray-200">
                    <TableCell className="font-medium text-gray-900">
                      {berth.berthName || berth.berth_name || berth.berth_number}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {berth.terminal_id}
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-500/10 text-amber-700 border-amber-500/30 border">
                        {berth.productService || 'Empty'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {berthsNeedingMigration.length > 20 && (
            <p className="text-sm text-gray-600 mt-4">
              Showing 20 of {berthsNeedingMigration.length} berths needing migration
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}