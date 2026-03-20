import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UpdateTerminalProductTypes() {
  const [results, setResults] = useState(null);

  const { data: terminals = [] } = useQuery({
    queryKey: ['terminals'],
    queryFn: () => base44.entities.Terminal.list()
  });

  const { data: productTypes = [] } = useQuery({
    queryKey: ['productTypes'],
    queryFn: () => base44.entities.ProductTypeRef.list()
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      const lngProductType = productTypes.find(pt => pt.code === 'LNG');
      
      if (!lngProductType) {
        throw new Error('LNG product type not found. Please seed product types first.');
      }

      const updated = [];
      const skipped = [];
      const errors = [];

      for (const terminal of terminals) {
        try {
          if (terminal.productTypeRefId) {
            skipped.push(terminal.name);
            continue;
          }

          await base44.entities.Terminal.update(terminal.id, {
            productTypeRefId: lngProductType.id,
            productTypeRefPublicId: lngProductType.publicId
          });
          updated.push(terminal.name);
        } catch (error) {
          errors.push({ name: terminal.name, error: error.message });
        }
      }

      return { updated, skipped, errors };
    },
    onSuccess: (data) => {
      setResults(data);
      if (data.updated.length > 0) {
        toast.success(`Updated ${data.updated.length} terminals`);
      }
    },
    onError: (error) => {
      toast.error('Update failed: ' + error.message);
    }
  });

  const terminalsWithoutProductType = terminals.filter(t => !t.productTypeRefId).length;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Update Terminal Product Types</h1>
        <p className="text-gray-600 mt-1">Set all terminals to LNG product type</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Bulk Update</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>{terminalsWithoutProductType}</strong> terminals without product type will be updated to <strong>LNG - Liquefied Natural Gas</strong>
            </p>
          </div>

          <Button
            onClick={() => updateMutation.mutate()}
            disabled={updateMutation.isPending || terminalsWithoutProductType === 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update All Terminals'
            )}
          </Button>

          {results && (
            <div className="space-y-3 pt-4 border-t border-gray-200">
              {results.updated.length > 0 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-900">Successfully Updated ({results.updated.length})</p>
                      <p className="text-sm text-emerald-700 mt-1">
                        {results.updated.join(', ')}
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
                      <p className="font-medium text-amber-900">Already Has Product Type (Skipped)</p>
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
                          {err.name}: {err.error}
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