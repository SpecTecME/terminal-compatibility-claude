import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2, AlertCircle, Ship } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '../components/utils/uuid';
import { getCurrentTenantId } from '../components/utils/tenant';

export default function SeedDocumentTypeExternalCodesDNV() {
  const [results, setResults] = useState([]);

  const dnvMappings = [
    { name: "Certificate of Class", code: "CLCE" },
    { name: "International Load Line Certificate", code: "ILLC-IC" },
    { name: "Cargo Ship Safety Construction Certificate", code: "CCC-IC" },
    { name: "Cargo Ship Safety Equipment Certificate", code: "CEC-IC" },
    { name: "Cargo Ship Safety Radio Certificate", code: "CRC-IC" },
    { name: "International Ship Security Certificate (ISSC)", code: "ISPS-IC", notes: "DNV documents sometimes label the certificate name as ISSC, but the DNV-style code shown in lists is ISPS-IC." },
    { name: "International Air Pollution Prevention (IAPP) Certificate", code: "IAPP-IC" },
    { name: "International Energy Efficiency Certificate (IEEC)", code: "EEC-IC" },
    { name: "Maritime Labour Certificate", code: "MLC-IC" },
    { name: "International Sewage Pollution Prevention Certificate", code: "SPP-IC" },
    { name: "International Anti-Fouling System Certificate", code: "AFS-IC" }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const localResults = [];
      const tenantId = getCurrentTenantId();

      // Fetch DNV company
      const companies = await base44.entities.Company.list();
      const dnvCompany = companies.find(c => c.name === "DNV" && c.type === "Authority");

      if (!dnvCompany) {
        return {
          success: false,
          error: "DNV company not found (name='DNV', type='Authority')",
          results: []
        };
      }

      // Fetch all document types and existing external codes
      const documentTypes = await base44.entities.DocumentType.list();
      const existingCodes = await base44.entities.DocumentTypeExternalCode.list();

      for (const mapping of dnvMappings) {
        try {
          // Find document type by exact name match
          const docType = documentTypes.find(dt => dt.name === mapping.name);

          if (!docType) {
            localResults.push({
              name: mapping.name,
              code: mapping.code,
              status: 'skipped',
              reason: 'DocumentType not found'
            });
            continue;
          }

          // Check for duplicate
          const duplicate = existingCodes.find(
            ec => ec.documentTypeId === docType.id && 
                  ec.authorityCompanyId === dnvCompany.id && 
                  ec.externalCode === mapping.code
          );

          if (duplicate) {
            localResults.push({
              name: mapping.name,
              code: mapping.code,
              status: 'skipped',
              reason: 'Already exists'
            });
            continue;
          }

          // Create external code mapping
          await base44.entities.DocumentTypeExternalCode.create({
            publicId: generateUUID(),
            tenantId: tenantId,
            documentTypeId: docType.id,
            documentTypePublicId: docType.publicId,
            authorityCompanyId: dnvCompany.id,
            authorityCompanyPublicId: dnvCompany.publicId,
            externalCode: mapping.code,
            codeType: "Certificate Code",
            isPrimary: true,
            isActive: true,
            notes: mapping.notes || "DNV-style certificate code observed in published vessel certificate / class-status style documents."
          });

          localResults.push({
            name: mapping.name,
            code: mapping.code,
            status: 'created'
          });

        } catch (error) {
          localResults.push({
            name: mapping.name,
            code: mapping.code,
            status: 'error',
            reason: error.message
          });
        }
      }

      return {
        success: true,
        results: localResults,
        dnvCompanyId: dnvCompany.id
      };
    },
    onSuccess: (data) => {
      if (data.success) {
        setResults(data.results);
        const created = data.results.filter(r => r.status === 'created').length;
        const skipped = data.results.filter(r => r.status === 'skipped').length;
        const errors = data.results.filter(r => r.status === 'error').length;
        toast.success(`Seeding complete: ${created} created, ${skipped} skipped, ${errors} errors`);
      } else {
        toast.error(data.error);
      }
    },
    onError: (error) => {
      toast.error('Seeding failed: ' + error.message);
    }
  });

  const getSummary = () => {
    if (results.length === 0) return null;

    const created = results.filter(r => r.status === 'created').length;
    const skippedDocType = results.filter(r => r.status === 'skipped' && r.reason === 'DocumentType not found').length;
    const skippedDuplicate = results.filter(r => r.status === 'skipped' && r.reason === 'Already exists').length;
    const errors = results.filter(r => r.status === 'error').length;

    return {
      created,
      skippedDocType,
      skippedDuplicate,
      errors,
      total: results.length
    };
  };

  const summary = getSummary();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed DNV External Codes</h1>
        <p className="text-gray-600 mt-1">Import DNV certificate code mappings for document types</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            DNV Certificate Code Mappings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">What this does:</h3>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Maps {dnvMappings.length} DNV certificate codes to existing document types</li>
              <li>Only creates mappings for document types that already exist</li>
              <li>Skips duplicates automatically</li>
              <li>Requires DNV company record (name="DNV", type="Authority")</li>
            </ul>
          </div>

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding DNV Mappings...
              </>
            ) : (
              <>
                <Ship className="w-4 h-4 mr-2" />
                Seed DNV External Codes
              </>
            )}
          </Button>

          {summary && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{summary.created}</div>
                  <div className="text-xs text-gray-600">Created</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{summary.skippedDocType}</div>
                  <div className="text-xs text-gray-600">Missing DocType</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{summary.skippedDuplicate}</div>
                  <div className="text-xs text-gray-600">Already Existed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{summary.errors}</div>
                  <div className="text-xs text-gray-600">Errors</div>
                </div>
              </div>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 space-y-2">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between p-3 rounded-lg border border-gray-200 bg-white"
                >
                  <div className="flex items-start gap-3 flex-1">
                    {result.status === 'created' && (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'skipped' && (
                      <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    )}
                    {result.status === 'error' && (
                      <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{result.name}</p>
                      <p className="text-xs text-gray-600 font-mono mt-0.5">Code: {result.code}</p>
                      {result.reason && (
                        <p className="text-xs text-gray-500 mt-1">{result.reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-xs font-medium">
                    {result.status === 'created' && (
                      <span className="text-green-600">Created</span>
                    )}
                    {result.status === 'skipped' && (
                      <span className="text-orange-600">Skipped</span>
                    )}
                    {result.status === 'error' && (
                      <span className="text-red-600">Error</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}