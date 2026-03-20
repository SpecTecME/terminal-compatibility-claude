import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Loader2, Play, Search } from 'lucide-react';
import { toast } from 'sonner';

export default function BackfillTerminalProductTypes() {
  const [result, setResult] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const { data: terminals = [], isLoading: loadingTerminals } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: productTypes = [], isLoading: loadingProductTypes } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const backfillMutation = useMutation({
    mutationFn: async () => {
      // Find LNG product type
      const lngProductType = productTypes.find(pt => pt.code === 'LNG');
      
      if (!lngProductType) {
        throw new Error('LNG Product Type not found. Please ensure it exists in ProductTypeRef.');
      }

      // Find terminals without product type
      const terminalsToUpdate = terminals.filter(t => !t.productTypeRefId);

      if (terminalsToUpdate.length === 0) {
        return {
          success: true,
          updated: 0,
          message: 'All terminals already have Product Type set'
        };
      }

      // Update terminals in batches to avoid rate limits
      const BATCH_SIZE = 10;
      const DELAY_MS = 500;
      let updated = 0;

      for (let i = 0; i < terminalsToUpdate.length; i += BATCH_SIZE) {
        const batch = terminalsToUpdate.slice(i, i + BATCH_SIZE);
        const updatePromises = batch.map(terminal =>
          base44.entities.Terminal.update(terminal.id, {
            productTypeRefId: lngProductType.id,
            productTypeRefPublicId: lngProductType.publicId
          })
        );

        await Promise.all(updatePromises);
        updated += batch.length;

        // Delay between batches (except for the last batch)
        if (i + BATCH_SIZE < terminalsToUpdate.length) {
          await new Promise(resolve => setTimeout(resolve, DELAY_MS));
        }
      }

      return {
        success: true,
        updated,
        message: `Successfully updated ${updated} terminals with LNG product type`
      };
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.message);
    },
    onError: (error) => {
      setResult({
        success: false,
        message: error.message
      });
      toast.error('Backfill failed: ' + error.message);
    }
  });

  const terminalsWithoutProductType = terminals.filter(t => !t.productTypeRefId);

  const filteredTerminals = terminalsWithoutProductType.filter(t => 
    !searchQuery || t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backfill Terminal Product Types</h1>
        <p className="text-gray-600 mt-1">
          Update all terminals without a Product Type to use "LNG"
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Current Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingTerminals || loadingProductTypes ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading data...</span>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600">Total Terminals</p>
                  <p className="text-2xl font-bold text-gray-900">{terminals.length}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                  <p className="text-sm text-amber-700">Terminals without Product Type</p>
                  <p className="text-2xl font-bold text-amber-900">{terminalsWithoutProductType.length}</p>
                </div>
              </div>

              {terminalsWithoutProductType.length > 0 && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder={`Search terminals... ${searchQuery ? `(${filteredTerminals.length})` : ''}`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-white border-gray-300 text-gray-900"
                    />
                  </div>
                </div>
              )}

              {terminalsWithoutProductType.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-900">Action Required</p>
                      <p className="text-sm text-blue-700 mt-1">
                        {terminalsWithoutProductType.length} terminal(s) need to be updated with LNG product type
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {result && (
                <div className={`${result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
                  <div className="flex items-start gap-3">
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className={`font-medium ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                        {result.success ? 'Success' : 'Error'}
                      </p>
                      <p className={`text-sm ${result.success ? 'text-emerald-700' : 'text-red-700'} mt-1`}>
                        {result.message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <Button
                  onClick={() => backfillMutation.mutate()}
                  disabled={backfillMutation.isPending || terminalsWithoutProductType.length === 0}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
                >
                  {backfillMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Backfill
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}