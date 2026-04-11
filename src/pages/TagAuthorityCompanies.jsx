import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TagAuthorityCompanies() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState([]);

  const tagMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      
      // Get or create "Classification Society" tag
      let tags = await base44.entities.SystemTag.list();
      let classificationTag = tags.find(t => t.name === 'Classification Society');
      
      if (!classificationTag) {
        classificationTag = await base44.entities.SystemTag.create({
          publicId: crypto.randomUUID(),
          tenantId: 'default-tenant',
          name: 'Classification Society',
          appliesTo: ['Company'],
          isActive: true
        });
        results.push({
          company: 'System',
          status: 'success',
          message: 'Created Classification Society tag'
        });
      }

      // Get all Authority companies
      const companies = await base44.entities.Company.filter({ type: 'Authority' });
      
      // Get existing tag assignments
      const existingAssignments = await base44.entities.CompanySystemTagAssignment.list();

      for (const company of companies) {
        // Check if already tagged
        const hasTag = existingAssignments.some(a => 
          a.companyId === company.id && a.systemTagId === classificationTag.id
        );

        if (hasTag) {
          results.push({
            company: company.name,
            status: 'skipped',
            message: 'Already tagged'
          });
          continue;
        }

        // Create tag assignment
        try {
          await base44.entities.CompanySystemTagAssignment.create({
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant',
            companyId: company.id,
            companyPublicId: company.publicId,
            systemTagId: classificationTag.id,
            systemTagPublicId: classificationTag.publicId
          });

          results.push({
            company: company.name,
            status: 'success',
            message: 'Tagged as Classification Society'
          });
        } catch (error) {
          results.push({
            company: company.name,
            status: 'error',
            message: error.message
          });
        }
      }

      return results;
    },
    onSuccess: (data) => {
      setResults(data);
      queryClient.invalidateQueries({ queryKey: ['companySystemTagAssignments'] });
      toast.success('Authority companies tagged successfully');
    },
    onError: (error) => {
      toast.error('Failed to tag companies: ' + error.message);
    }
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tag Authority Companies</h1>
        <p className="text-gray-600 mt-1">
          Add "Classification Society" system tag to all Authority type companies
        </p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle>Apply Classification Society Tag</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Create "Classification Society" system tag if it doesn't exist</li>
                  <li>Find all companies with type = "Authority"</li>
                  <li>Assign the tag to each Authority company</li>
                  <li>Skip companies already tagged</li>
                </ul>
                <p className="mt-3 font-medium">Safe to run multiple times</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => tagMutation.mutate()}
            disabled={tagMutation.isPending}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {tagMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Tagging Companies...
              </>
            ) : (
              'Tag Authority Companies'
            )}
          </Button>

          {results.length > 0 && (
            <div className="space-y-2 mt-4">
              <h3 className="font-medium text-gray-900">Results:</h3>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border flex items-start gap-3 ${
                    result.status === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : result.status === 'skipped'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  {result.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                      result.status === 'skipped' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{result.company}</p>
                    <p className="text-sm text-gray-600">{result.message}</p>
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