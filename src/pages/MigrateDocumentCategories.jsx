import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function MigrateDocumentCategories() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const getCategoryRef = (name) => {
    const cat = categories.find(c => c.name === name);
    return cat ? { id: cat.id, publicId: cat.publicId } : null;
  };

  const determineCategoryMapping = (docType) => {
    // Handle NULL categories - leave unchanged
    if (!docType.category) {
      return null;
    }

    const oldCategory = docType.category;
    const name = docType.name?.toLowerCase() || '';

    // Certificates → Flag or Class
    if (oldCategory === 'Certificates') {
      // Flag certifications
      if (name.includes('solas') || name.includes('marpol') || name.includes('ism') || 
          name.includes('doc') || name.includes('smc') || name.includes('registry') || 
          name.includes('tonnage') || name.includes('load line') || name.includes('pollution') ||
          name.includes('energy efficiency') || name.includes('ieec')) {
        return 'Flag Certification';
      }
      // Class certifications
      if (name.includes('class') || name.includes('hull') || name.includes('machinery') || 
          name.includes('containment') || name.includes('memorandum')) {
        return 'Class Certification';
      }
      // Default for generic certificates
      return 'Flag Certification';
    }

    // Safety → Vetting & OCIMF
    if (oldCategory === 'Safety') {
      return 'Vetting & OCIMF';
    }

    // SIRE Reports → Vetting & OCIMF
    if (oldCategory === 'SIRE Reports') {
      return 'Vetting & OCIMF';
    }

    // No mapping needed for other categories
    return null;
  };

  const handleMigration = async () => {
    if (categories.length === 0) {
      toast.error('Please seed DocumentCategory first');
      return;
    }

    setProcessing(true);
    const migrationResults = {
      updated: 0,
      skipped: 0,
      nullCategories: 0,
      unmappedCategories: [],
      errors: []
    };

    try {
      for (const docType of documentTypes) {
        // Skip if already has categoryId
        if (docType.categoryId) {
          migrationResults.skipped++;
          continue;
        }

        // Handle NULL categories
        if (!docType.category) {
          migrationResults.nullCategories++;
          continue;
        }

        const newCategoryName = determineCategoryMapping(docType);
        
        if (!newCategoryName) {
          migrationResults.unmappedCategories.push({
            name: docType.name,
            oldCategory: docType.category
          });
          continue;
        }

        const categoryRef = getCategoryRef(newCategoryName);
        if (!categoryRef) {
          migrationResults.errors.push({
            name: docType.name,
            error: `Category not found: ${newCategoryName}`
          });
          continue;
        }

        try {
          await base44.entities.DocumentType.update(docType.id, {
            categoryId: categoryRef.id,
            categoryPublicId: categoryRef.publicId
          });
          migrationResults.updated++;
        } catch (error) {
          migrationResults.errors.push({
            name: docType.name,
            error: error.message
          });
        }
      }

      setResults(migrationResults);
      toast.success(`Migrated ${migrationResults.updated} document types`);
    } catch (error) {
      toast.error('Migration failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Migrate Document Categories</h1>
        <p className="text-gray-600 mt-1">
          Update existing DocumentType records to use the new DocumentCategory table
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This will migrate legacy category values to the new controlled DocumentCategory table.
          Records with NULL categories will be left unchanged for manual review.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Migration Rules</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="font-medium text-gray-900">Certificates →</p>
              <p className="text-gray-600 ml-4">• Flag Certification (for statutory certificates)</p>
              <p className="text-gray-600 ml-4">• Class Certification (for class-issued certificates)</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="font-medium text-gray-900">Safety → Vetting & OCIMF</p>
            </div>
            <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
              <p className="font-medium text-gray-900">SIRE Reports → Vetting & OCIMF</p>
            </div>
            <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
              <p className="font-medium text-amber-900">NULL categories → Left unchanged</p>
              <p className="text-amber-700 text-xs mt-1">These will be reviewed manually</p>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-600">Categories available:</p>
                <p className="text-lg font-bold text-gray-900">{categories.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Document types:</p>
                <p className="text-lg font-bold text-gray-900">{documentTypes.length}</p>
              </div>
            </div>

            <Button
              onClick={handleMigration}
              disabled={processing || categories.length === 0}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Migrating...
                </>
              ) : (
                'Start Migration'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Migration Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700">Updated</p>
                  <p className="text-2xl font-bold text-emerald-900">{results.updated}</p>
                </div>
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <p className="text-sm text-gray-700">Skipped (already migrated)</p>
                  <p className="text-2xl font-bold text-gray-900">{results.skipped}</p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <p className="text-sm text-amber-700">NULL categories (unchanged)</p>
                  <p className="text-2xl font-bold text-amber-900">{results.nullCategories}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="text-sm text-blue-700">Unmapped categories</p>
                  <p className="text-2xl font-bold text-blue-900">{results.unmappedCategories.length}</p>
                </div>
              </div>

              {results.unmappedCategories.length > 0 && (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                  <p className="font-medium text-blue-900 mb-2">Unmapped Categories:</p>
                  <div className="space-y-1">
                    {results.unmappedCategories.map((item, idx) => (
                      <p key={idx} className="text-sm text-blue-700">
                        {item.name} (was: {item.oldCategory})
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="font-medium text-red-900 mb-2">Errors:</p>
                  <div className="space-y-1">
                    {results.errors.map((err, idx) => (
                      <p key={idx} className="text-sm text-red-700">
                        {err.name}: {err.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}