import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { generateUUID } from '../components/utils/uuid';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function BackfillPublicIds() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const entityTypes = [
    'Terminal',
    'Vessel', 
    'Document',
    'DocumentType',
    'IssuingAuthority',
    'Berth',
    'VesselCompatibility',
    'TerminalNews',
    'TerminalForm',
    'TerminalDocument',
    'TerminalProcedure',
    'TerminalDocumentRequirement',
    'ApprovalSubmission',
    'Country',
    'TerminalType',
    'MaritimeZone',
    'CountryMaritimeZone'
  ];

  // Step 1: Add publicId and tenantId to all records
  const backfillBasicFields = async (entityName) => {
    const records = await base44.entities[entityName].list();
    
    let updated = 0;
    let skipped = 0;
    const errors = [];

    for (const record of records) {
      try {
        const updates = {};
        
        // Add publicId if missing
        if (!record.publicId) {
          updates.publicId = generateUUID();
        }
        
        // Add tenantId if missing
        if (!record.tenantId) {
          updates.tenantId = 'default-tenant';
        }

        if (Object.keys(updates).length > 0) {
          await base44.entities[entityName].update(record.id, updates);
          updated++;
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`Error updating ${entityName} ${record.id}:`, error);
        errors.push({ id: record.id, error: error.message });
      }
    }

    return { total: records.length, updated, skipped, errors };
  };

  // Step 2: Rename legacy fields in Document and DocumentType
  const renameLegacyFields = async () => {
    const renameResults = {};

    // Rename Document fields
    try {
      const documents = await base44.entities.Document.list();
      let renamed = 0;

      for (const doc of documents) {
        const updates = {};
        
        // Rename document_type_id → documentTypeId
        if (doc.document_type_id && !doc.documentTypeId) {
          updates.documentTypeId = doc.document_type_id;
        }
        
        // Rename issuing_authority_id → issuingAuthorityId
        if (doc.issuing_authority_id && !doc.issuingAuthorityId) {
          updates.issuingAuthorityId = doc.issuing_authority_id;
        }

        if (Object.keys(updates).length > 0) {
          await base44.entities.Document.update(doc.id, updates);
          renamed++;
        }
      }

      renameResults.Document = { renamed };
    } catch (error) {
      renameResults.Document = { error: error.message };
    }

    // Rename DocumentType fields
    try {
      const documentTypes = await base44.entities.DocumentType.list();
      let renamed = 0;

      for (const dt of documentTypes) {
        const updates = {};
        
        // Rename issuing_authority_id → issuingAuthorityId
        if (dt.issuing_authority_id && !dt.issuingAuthorityId) {
          updates.issuingAuthorityId = dt.issuing_authority_id;
        }

        if (Object.keys(updates).length > 0) {
          await base44.entities.DocumentType.update(dt.id, updates);
          renamed++;
        }
      }

      renameResults.DocumentType = { renamed };
    } catch (error) {
      renameResults.DocumentType = { error: error.message };
    }

    return renameResults;
  };

  // Step 3: Backfill relationship publicId fields
  const backfillRelationships = async () => {
    const relationshipResults = {};

    // 1. DocumentType.issuingAuthorityPublicId
    try {
      const documentTypes = await base44.entities.DocumentType.list();
      const authorities = await base44.entities.IssuingAuthority.list();
      const authorityMap = Object.fromEntries(authorities.map(a => [a.id, a.publicId]));
      
      let updated = 0;
      let skipped = 0;
      let unmatched = 0;

      for (const dt of documentTypes) {
        if (dt.issuingAuthorityId && !dt.issuingAuthorityPublicId) {
          const publicId = authorityMap[dt.issuingAuthorityId];
          if (publicId) {
            await base44.entities.DocumentType.update(dt.id, { issuingAuthorityPublicId: publicId });
            updated++;
          } else {
            unmatched++;
          }
        } else {
          skipped++;
        }
      }

      relationshipResults.DocumentType_Authority = { updated, skipped, unmatched };
    } catch (error) {
      relationshipResults.DocumentType_Authority = { error: error.message };
    }

    // 2. Document relationships
    try {
      const documents = await base44.entities.Document.list();
      const vessels = await base44.entities.Vessel.list();
      const documentTypes = await base44.entities.DocumentType.list();
      const authorities = await base44.entities.IssuingAuthority.list();
      
      const vesselMap = Object.fromEntries(vessels.map(v => [v.id, v.publicId]));
      const docTypeMap = Object.fromEntries(documentTypes.map(dt => [dt.id, dt.publicId]));
      const authorityMap = Object.fromEntries(authorities.map(a => [a.id, a.publicId]));
      
      let vesselUpdated = 0, docTypeUpdated = 0, authUpdated = 0;
      let vesselUnmatched = 0, docTypeUnmatched = 0, authUnmatched = 0;

      for (const doc of documents) {
        const updates = {};
        
        // Vessel publicId
        if (doc.vessel_id && !doc.vesselPublicId) {
          const publicId = vesselMap[doc.vessel_id];
          if (publicId) {
            updates.vesselPublicId = publicId;
            vesselUpdated++;
          } else {
            vesselUnmatched++;
          }
        }
        
        // DocumentType publicId
        if (doc.documentTypeId && !doc.documentTypePublicId) {
          const publicId = docTypeMap[doc.documentTypeId];
          if (publicId) {
            updates.documentTypePublicId = publicId;
            docTypeUpdated++;
          } else {
            docTypeUnmatched++;
          }
        }
        
        // IssuingAuthority publicId
        if (doc.issuingAuthorityId && !doc.issuingAuthorityPublicId) {
          const publicId = authorityMap[doc.issuingAuthorityId];
          if (publicId) {
            updates.issuingAuthorityPublicId = publicId;
            authUpdated++;
          } else {
            authUnmatched++;
          }
        }

        if (Object.keys(updates).length > 0) {
          await base44.entities.Document.update(doc.id, updates);
        }
      }

      relationshipResults.Document_Vessel = { updated: vesselUpdated, unmatched: vesselUnmatched };
      relationshipResults.Document_DocumentType = { updated: docTypeUpdated, unmatched: docTypeUnmatched };
      relationshipResults.Document_Authority = { updated: authUpdated, unmatched: authUnmatched };
    } catch (error) {
      relationshipResults.Document_Relationships = { error: error.message };
    }

    return relationshipResults;
  };

  const handleBackfill = async () => {
    setProcessing(true);
    const allResults = {
      basicFields: {},
      renamedFields: {},
      relationships: {}
    };

    try {
      // Step 1: Backfill publicId and tenantId
      for (const entityName of entityTypes) {
        const result = await backfillBasicFields(entityName);
        allResults.basicFields[entityName] = result;
      }

      // Step 2: Rename legacy fields
      allResults.renamedFields = await renameLegacyFields();

      // Step 3: Backfill relationship publicId fields
      allResults.relationships = await backfillRelationships();

      setResults(allResults);
      toast.success('Backfill completed successfully');
    } catch (error) {
      toast.error('Backfill failed: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Backfill Migration Fields</h1>
        <p className="text-gray-600 mt-1">
          Add publicId and tenantId to existing records for migration readiness
        </p>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          This operation will add publicId (UUID) and tenantId to all existing records that don't have them.
          Existing records with these fields will be skipped.
        </AlertDescription>
      </Alert>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            Entities to Process
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-6">
            {entityTypes.map((entity) => (
              <div key={entity} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <span className="text-gray-900 font-medium">{entity}</span>
                {results?.basicFields?.[entity] && (
                  <div className="flex items-center gap-2 text-sm">
                    {results.basicFields[entity].errors?.length > 0 ? (
                      <XCircle className="w-4 h-4 text-red-500" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    )}
                    <span className="text-gray-600">
                      {results.basicFields[entity].updated} updated, {results.basicFields[entity].skipped} skipped
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Button
            onClick={handleBackfill}
            disabled={processing}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {processing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Backfill'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <>
          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Basic Fields Backfill Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {Object.entries(results.basicFields).map(([entity, result]) => (
                  <div key={entity} className="flex justify-between text-sm p-2 rounded bg-gray-50">
                    <span className="text-gray-700 font-medium">{entity}:</span>
                    <span className="text-gray-900">
                      {result.total} total, {result.updated} updated
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Field Renaming Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(results.renamedFields).map(([entity, result]) => (
                  <div key={entity} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-900 font-medium">{entity}</span>
                      {result.error ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {result.error ? (
                      <p className="text-xs text-red-600">{result.error}</p>
                    ) : (
                      <p className="text-xs text-gray-600">Renamed: {result.renamed} records</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                Relationship Backfill Complete
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(results.relationships).map(([relationship, result]) => (
                  <div key={relationship} className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-900 font-medium">{relationship}</span>
                      {result.error ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      )}
                    </div>
                    {result.error ? (
                      <p className="text-xs text-red-600">{result.error}</p>
                    ) : (
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>Updated: {result.updated}</span>
                        {result.skipped !== undefined && <span>Skipped: {result.skipped}</span>}
                        {result.unmatched > 0 && (
                          <span className="text-amber-600">Unmatched: {result.unmatched}</span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}