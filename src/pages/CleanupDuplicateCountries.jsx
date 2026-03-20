import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Trash2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CleanupDuplicateCountries() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const { data: countries = [], isLoading, refetch } = useQuery({
    queryKey: ['countries-all'],
    queryFn: () => base44.entities.Country.list()
  });

  const findDuplicates = () => {
    const countryMap = {};
    
    countries.forEach(country => {
      const iso2 = country.iso2;
      if (!countryMap[iso2]) {
        countryMap[iso2] = [];
      }
      countryMap[iso2].push(country);
    });

    const duplicates = {};
    Object.keys(countryMap).forEach(iso2 => {
      if (countryMap[iso2].length > 1) {
        // Sort by created_date to keep the oldest
        countryMap[iso2].sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        duplicates[iso2] = countryMap[iso2];
      }
    });

    return duplicates;
  };

  const handleCleanup = async () => {
    setProcessing(true);
    const duplicates = findDuplicates();
    
    const stats = {
      total: 0,
      deleted: 0,
      errors: []
    };

    try {
      for (const iso2 in duplicates) {
        const countryList = duplicates[iso2];
        const toKeep = countryList[0];
        const toDelete = countryList.slice(1);

        stats.total += toDelete.length;

        for (const country of toDelete) {
          try {
            await base44.entities.Country.delete(country.id);
            stats.deleted++;
            console.log(`Deleted duplicate: ${country.nameEn} (${iso2}) - ID: ${country.id}`);
          } catch (err) {
            stats.errors.push({
              iso2,
              name: country.nameEn,
              id: country.id,
              error: err.message
            });
          }
        }
      }

      setResults(stats);
      await refetch();
      
      if (stats.deleted > 0) {
        toast.success(`Successfully deleted ${stats.deleted} duplicate countries`);
      }
      if (stats.errors.length > 0) {
        toast.error(`${stats.errors.length} errors occurred during cleanup`);
      }
    } catch (err) {
      toast.error('Cleanup failed: ' + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const duplicates = findDuplicates();
  const duplicateCount = Object.keys(duplicates).length;
  const totalDuplicateRecords = Object.values(duplicates).reduce((sum, list) => sum + list.length - 1, 0);

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
        <h1 className="text-2xl font-bold text-gray-900">Cleanup Duplicate Countries</h1>
        <p className="text-gray-600 mt-1">Remove duplicate country records based on ISO2 code</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Duplicate Detection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {duplicateCount === 0 ? (
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle className="w-5 h-5" />
              <p>No duplicate countries found. All ISO2 codes are unique.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-5 h-5" />
                <p>
                  Found <strong>{duplicateCount}</strong> ISO2 codes with duplicates 
                  ({totalDuplicateRecords} duplicate records to remove)
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium text-gray-900">Duplicate Groups:</h3>
                {Object.keys(duplicates).map(iso2 => {
                  const countryList = duplicates[iso2];
                  const toKeep = countryList[0];
                  const toDelete = countryList.slice(1);

                  return (
                    <div key={iso2} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="font-medium text-gray-900 mb-2">
                        ISO2: {iso2} ({countryList.length} records)
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-emerald-600">
                          <CheckCircle className="w-4 h-4" />
                          <span>KEEP: {toKeep.nameEn} (ID: {toKeep.id}, Created: {new Date(toKeep.created_date).toLocaleString()})</span>
                        </div>
                        {toDelete.map(country => (
                          <div key={country.id} className="flex items-center gap-2 text-red-600">
                            <Trash2 className="w-4 h-4" />
                            <span>DELETE: {country.nameEn} (ID: {country.id}, Created: {new Date(country.created_date).toLocaleString()})</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <Button 
                onClick={handleCleanup}
                disabled={processing}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
              >
                {processing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Cleaning up...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Duplicates
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Cleanup Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Total Duplicates</p>
                <p className="text-2xl font-bold text-gray-900">{results.total}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <p className="text-sm text-emerald-600">Successfully Deleted</p>
                <p className="text-2xl font-bold text-emerald-600">{results.deleted}</p>
              </div>
            </div>

            {results.errors.length > 0 && (
              <div>
                <h3 className="font-medium text-red-600 mb-2">Errors ({results.errors.length}):</h3>
                <div className="space-y-2">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="p-3 bg-red-50 rounded border border-red-200 text-sm">
                      <p className="text-red-900">
                        <strong>{err.name}</strong> ({err.iso2}) - ID: {err.id}
                      </p>
                      <p className="text-red-600">{err.error}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}