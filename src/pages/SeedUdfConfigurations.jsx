import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const DEFAULT_CONFIGS = [
  {
    module: 'Vessel',
    udfCode: 'UDF01',
    label: null,
    fieldType: 'Text',
    maxLength: 10,
    includeInSearch: true,
    createList: true,
    sortOrder: 10
  },
  {
    module: 'Vessel',
    udfCode: 'UDF02',
    label: null,
    fieldType: 'Text',
    maxLength: 12,
    includeInSearch: true,
    createList: false,
    sortOrder: 20
  }
];

export default function SeedUdfConfigurations() {
  const queryClient = useQueryClient();
  const [seeding, setSeeding] = useState(false);
  const [results, setResults] = useState({});

  const { data: existingConfigs = [], isLoading, refetch } = useQuery({
    queryKey: ['udfConfigurations'],
    queryFn: () => base44.entities.UdfConfiguration.list()
  });

  const handleSeed = async () => {
    setSeeding(true);
    setResults({});
    const newResults = {};

    for (const config of DEFAULT_CONFIGS) {
      const key = `${config.module}-${config.udfCode}`;
      try {
        const existing = existingConfigs.find(
          c => c.module === config.module && c.udfCode === config.udfCode
        );

        if (existing) {
          newResults[key] = { status: 'skipped', message: 'Already exists' };
        } else {
          await base44.entities.UdfConfiguration.create({
            ...config,
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant'
          });
          newResults[key] = { status: 'created', message: 'Created successfully' };
        }
      } catch (error) {
        newResults[key] = { status: 'error', message: error.message };
      }
      setResults({ ...newResults });
    }

    setSeeding(false);
    queryClient.invalidateQueries(['udfConfigurations']);
    refetch();
    toast.success('Seeding complete');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('UdfConfigurations')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seed UDF Configurations</h1>
          <p className="text-sm text-gray-600 mt-1">Initialize default UDF configurations</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Default Configurations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create the following UDF configurations (if they don't already exist):
          </p>

          <div className="space-y-3">
            {DEFAULT_CONFIGS.map((config) => {
              const key = `${config.module}-${config.udfCode}`;
              const existing = existingConfigs.find(
                c => c.module === config.module && c.udfCode === config.udfCode
              );
              const result = results[key];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{config.module}</span>
                      <Badge variant="outline" className="font-mono">{config.udfCode}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Type: {config.fieldType} | Max: {config.maxLength} chars |
                      {config.createList ? ' Dropdown' : ' Free text'}
                    </div>
                  </div>
                  <div>
                    {result ? (
                      <Badge
                        className={
                          result.status === 'created'
                            ? 'bg-green-100 text-green-800'
                            : result.status === 'skipped'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }
                      >
                        {result.status === 'created' && <Check className="w-3 h-3 mr-1" />}
                        {result.status === 'error' && <X className="w-3 h-3 mr-1" />}
                        {result.message}
                      </Badge>
                    ) : existing ? (
                      <Badge className="bg-gray-100 text-gray-600">Already exists</Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-800">Will be created</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Link to={createPageUrl('UdfConfigurations')}>
              <Button variant="outline">Cancel</Button>
            </Link>
            <Button onClick={handleSeed} disabled={seeding}>
              {seeding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Seeding...
                </>
              ) : (
                'Seed Configurations'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}