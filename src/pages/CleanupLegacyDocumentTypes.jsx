import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CleanupLegacyDocumentTypes() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const { data: documentUploads = [] } = useQuery({
    queryKey: ['documentUploads'],
    queryFn: () => base44.entities.DocumentUpload.list()
  });

  const legacyDocumentTypes = documentTypes.filter(dt => dt.legacyCategoryText);
  const newDocumentTypes = documentTypes.filter(dt => !dt.legacyCategoryText);

  const analyzeReferences = async () => {
    setProcessing(true);
    const analysis = {
      safeToDelete: [],
      hasReferences: [],
      totalLegacy: legacyDocumentTypes.length
    };

    try {
      for (const docType of legacyDocumentTypes) {
        const references = documentUploads.filter(du => du.documentTypeId === docType.id);
        
        if (references.length > 0) {
          analysis.hasReferences.push({
            docType,
            referenceCount: references.length,
            references
          });
        } else {
          analysis.safeToDelete.push(docType);
        }
      }

      setAnalysisResults(analysis);
      toast.success('Analysis complete');
    } catch (error) {
      toast.error('Analysis failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCleanup = async () => {
    if (!analysisResults) {
      toast.error('Please run analysis first');
      return;
    }

    if (analysisResults.hasReferences.length > 0) {
      toast.error('Cannot delete: some document types are referenced by uploads');
      return;
    }

    setProcessing(true);
    const cleanupResults = { deleted: 0, errors: [] };

    try {
      for (const docType of analysisResults.safeToDelete) {
        try {
          await base44.entities.DocumentType.delete(docType.id);
          cleanupResults.deleted++;
        } catch (error) {
          cleanupResults.errors.push({
            name: docType.name,
            error: error.message
          });
        }
      }

      setResults(cleanupResults);
      toast.success(`Deleted ${cleanupResults.deleted} legacy document types`);
    } catch (error) {
      toast.error('Cleanup failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cleanup Legacy Document Types</h1>
        <p className="text-gray-600 mt-1">
          Remove legacy DocumentType records that have legacyCategoryText populated
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This will delete DocumentType records where legacyCategoryText IS NOT NULL.
          Records with existing DocumentUpload references will be blocked from deletion.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-3 gap-4">
        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{legacyDocumentTypes.length}</p>
                <p className="text-xs text-gray-600">Legacy Records</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{newDocumentTypes.length}</p>
                <p className="text-xs text-gray-600">New Master List</p>
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
                <p className="text-2xl font-bold text-gray-900">{documentUploads.length}</p>
                <p className="text-xs text-gray-600">Total Uploads</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Step 1: Analyze References</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            Scan for DocumentUpload references before deletion
          </p>
          <Button
            onClick={analyzeReferences}
            disabled={processing || legacyDocumentTypes.length === 0}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing && !analysisResults ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              'Analyze Legacy Document Types'
            )}
          </Button>
        </CardContent>
      </Card>

      {analysisResults && (
        <>
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="text-sm text-emerald-700 mb-1">Safe to Delete</p>
                  <p className="text-2xl font-bold text-emerald-900">{analysisResults.safeToDelete.length}</p>
                </div>
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="text-sm text-red-700 mb-1">Has References (Blocked)</p>
                  <p className="text-2xl font-bold text-red-900">{analysisResults.hasReferences.length}</p>
                </div>
              </div>

              {analysisResults.hasReferences.length > 0 && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                  <p className="font-medium text-red-900 mb-3">Referenced Document Types (Cannot Delete):</p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {analysisResults.hasReferences.map((item, idx) => (
                      <div key={idx} className="p-3 rounded bg-white border border-red-200">
                        <p className="text-sm font-medium text-red-900">{item.docType.name}</p>
                        <p className="text-xs text-red-700">
                          {item.referenceCount} upload(s) • Legacy Category: {item.docType.legacyCategoryText}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResults.safeToDelete.length > 0 && (
                <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                  <p className="font-medium text-emerald-900 mb-3">Safe to Delete:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {analysisResults.safeToDelete.map((dt, idx) => (
                      <p key={idx} className="text-sm text-emerald-700">
                        • {dt.name} ({dt.legacyCategoryText})
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Step 2: Execute Cleanup</CardTitle>
            </CardHeader>
            <CardContent>
              {analysisResults.hasReferences.length > 0 ? (
                <Alert className="bg-red-50 border-red-200">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-900">
                    Cannot proceed: {analysisResults.hasReferences.length} document type(s) have references.
                    Delete or reassign the DocumentUpload records first.
                  </AlertDescription>
                </Alert>
              ) : (
                <Button
                  onClick={handleCleanup}
                  disabled={processing || analysisResults.safeToDelete.length === 0}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600"
                >
                  {processing && analysisResults ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete {analysisResults.safeToDelete.length} Legacy Record(s)
                    </>
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {results && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Cleanup Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-gray-900">Deleted: {results.deleted}</p>
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-red-600 font-medium">Errors:</p>
                  {results.errors.map((err, idx) => (
                    <p key={idx} className="text-sm text-red-600">{err.name}: {err.error}</p>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}