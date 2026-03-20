import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SeedDocumentTypeAliases() {
  const [isSeeding, setIsSeeding] = useState(false);
  const [results, setResults] = useState([]);

  const { data: documentTypes = [] } = useQuery({
    queryKey: ['documentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  const aliasMapping = {
    'LNG Carrier General Arrangement (GA)': ['GA', 'General Arrangement'],
    'Manifold Arrangement Drawing': ['Manifold Drawing'],
    'Ship or Shore Interface Drawings': ['SSI', 'Ship Shore Interface'],
    'LNG Manifold Data Sheet': ['LNG Manifold'],
    'Mooring Arrangement Plan': ['MAP', 'Mooring Plan'],
    'Ship Energy Management or Power Availability (Cold Ironing)': ['Cold Ironing', 'Shore Power'],
    'Maximum Allowable Berthing Velocity': ['Berthing Velocity'],
    'Optimoor Mooring Study or Equivalent': ['Optimoor', 'Mooring Study'],
    'Completed Terminal Compatibility Spreadsheet': ['Terminal Compatibility', 'Compatibility Spreadsheet'],
    'Gas Form C': ['Gas Form C'],
    'ESD Link Compatibility Statement': ['ESD', 'ESD Link'],
    'Emergency Release System (ERS) Compatibility Statement': ['ERS', 'Emergency Release System'],
    'Vapour Return Compatibility Statement': ['Vapour Return', 'VR'],
    'OCIMF Vessel Particular Questionnaire (VPQ LNG)': ['VPQ', 'VPQ LNG'],
    'OCIMF TMSA Report': ['TMSA'],
    'OCIMF SIRE Inspection Report or SIRE 2.0': ['SIRE', 'SIRE 2.0'],
    'International Tonnage Certificate': ['ITC'],
    'DOC and SMC (ISM Code)': ['DOC', 'SMC'],
    'Certificate of Class': ['CoC'],
    'Hull and Machinery Certificate': ['H&M'],
    'Cargo Containment System Certificate': ['CCS'],
    'International Ship Security Certificate (ISSC)': ['ISSC'],
    'Pilot Card / Wheelhouse Poster': ['Pilot Card'],
    'Pre-Arrival Information Form': ['PAF', 'Pre-Arrival'],
    'P&I Certificate of Entry': ['P&I', 'COE']
  };

  const findDocumentType = (name) => {
    return documentTypes.find(dt => 
      dt.name === name || 
      dt.name.toLowerCase() === name.toLowerCase()
    );
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    setResults([]);
    const seedResults = [];

    for (const [docTypeName, aliases] of Object.entries(aliasMapping)) {
      const docType = findDocumentType(docTypeName);
      
      if (docType) {
        try {
          await base44.entities.DocumentType.update(docType.id, {
            searchAliases: aliases
          });
          seedResults.push({
            success: true,
            name: docTypeName,
            aliases: aliases.join(', ')
          });
        } catch (error) {
          seedResults.push({
            success: false,
            name: docTypeName,
            error: error.message
          });
        }
      } else {
        seedResults.push({
          success: false,
          name: docTypeName,
          error: 'Document type not found'
        });
      }
    }

    setResults(seedResults);
    setIsSeeding(false);
    
    const successCount = seedResults.filter(r => r.success).length;
    const failCount = seedResults.filter(r => !r.success).length;
    
    if (failCount === 0) {
      toast.success(`Successfully added aliases to ${successCount} document types`);
    } else {
      toast.warning(`Added aliases to ${successCount} document types, ${failCount} failed`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Document Type Search Aliases</h1>
        <p className="text-gray-600 mt-1">Add industry-standard abbreviations for improved search</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Search Aliases Seeding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900 font-medium mb-2">
              This will add search aliases to {Object.keys(aliasMapping).length} document types
            </p>
            <p className="text-xs text-blue-800">
              Examples: VPQ, SIRE, ERS, GA, DOC, SMC, TMSA, ISSC, P&I
            </p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-900">
              <strong>Note:</strong> Only industry-standard abbreviations are added. Search aliases are not displayed in the UI, only used for matching.
            </p>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isSeeding}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {isSeeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Aliases...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Add Search Aliases
              </>
            )}
          </Button>

          {results.length > 0 && (
            <div className="mt-6 space-y-2">
              <h3 className="font-semibold text-gray-900">Results:</h3>
              <div className="max-h-96 overflow-y-auto space-y-2">
                {results.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-3 p-3 rounded-lg ${
                      result.success
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-red-50 border border-red-200'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${result.success ? 'text-emerald-900' : 'text-red-900'}`}>
                        {result.name}
                      </p>
                      <p className={`text-xs ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
                        {result.success ? `Aliases: ${result.aliases}` : `Error: ${result.error}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}