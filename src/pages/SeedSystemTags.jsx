import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function SeedSystemTags() {
  const queryClient = useQueryClient();
  const [results, setResults] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: existingTags = [] } = useQuery({
    queryKey: ['contactTags'],
    queryFn: () => base44.entities.ContactTag.list()
  });

  const systemTagsData = [
    // Contact-applicable tags
    { name: 'Security', code: 'SECURITY', category: 'Safety & Security', appliesTo: ['Contact'], sortOrder: 1 },
    { name: 'Safety', code: 'SAFETY', category: 'Safety & Security', appliesTo: ['Contact'], sortOrder: 2 },
    { name: 'HSSE', code: 'HSSE', category: 'Safety & Security', appliesTo: ['Contact'], sortOrder: 3 },
    { name: 'Emergency 24/7', code: 'EMERGENCY_24_7', category: 'Safety & Security', appliesTo: ['Contact'], sortOrder: 4 },
    { name: 'Incident Reporting', code: 'INCIDENT_REPORTING', category: 'Safety & Security', appliesTo: ['Contact'], sortOrder: 5 },
    
    { name: 'Operations', code: 'OPERATIONS', category: 'Operations', appliesTo: ['Contact'], sortOrder: 10 },
    { name: 'Marine Operations', code: 'MARINE_OPERATIONS', category: 'Operations', appliesTo: ['Contact'], sortOrder: 11 },
    { name: 'Berthing & Mooring', code: 'BERTHING_MOORING', category: 'Operations', appliesTo: ['Contact'], sortOrder: 12 },
    { name: 'Scheduling', code: 'SCHEDULING', category: 'Operations', appliesTo: ['Contact'], sortOrder: 13 },
    { name: 'Control Room', code: 'CONTROL_ROOM', category: 'Operations', appliesTo: ['Contact'], sortOrder: 14 },
    { name: 'Cargo Operations', code: 'CARGO_OPERATIONS', category: 'Operations', appliesTo: ['Contact'], sortOrder: 15 },
    
    { name: 'Vessel Registration', code: 'VESSEL_REGISTRATION', category: 'Compatibility & Vetting', appliesTo: ['Contact'], sortOrder: 20 },
    { name: 'Terminal Compatibility', code: 'TERMINAL_COMPATIBILITY', category: 'Compatibility & Vetting', appliesTo: ['Contact'], sortOrder: 21 },
    { name: 'Documentation Renewal', code: 'DOCUMENTATION_RENEWAL', category: 'Compatibility & Vetting', appliesTo: ['Contact'], sortOrder: 22 },
    { name: 'Vetting', code: 'VETTING', category: 'Compatibility & Vetting', appliesTo: ['Contact'], sortOrder: 23 },
    
    { name: 'Commercial', code: 'COMMERCIAL', category: 'Commercial & Admin', appliesTo: ['Contact'], sortOrder: 30 },
    { name: 'Contracts', code: 'CONTRACTS', category: 'Commercial & Admin', appliesTo: ['Contact'], sortOrder: 31 },
    { name: 'Billing & Invoicing', code: 'BILLING', category: 'Commercial & Admin', appliesTo: ['Contact'], sortOrder: 32 },
    { name: 'Legal', code: 'LEGAL', category: 'Commercial & Admin', appliesTo: ['Contact'], sortOrder: 33 },
    
    { name: 'Group Mailbox', code: 'GROUP_MAILBOX', category: 'Contact Type', appliesTo: ['Contact'], sortOrder: 40 },
    { name: 'Primary Contact', code: 'PRIMARY_CONTACT', category: 'Contact Type', appliesTo: ['Contact'], sortOrder: 41 },
    { name: 'Backup Contact', code: 'BACKUP_CONTACT', category: 'Contact Type', appliesTo: ['Contact'], sortOrder: 42 },
    { name: 'Decision Maker', code: 'DECISION_MAKER', category: 'Contact Type', appliesTo: ['Contact'], sortOrder: 43 },
    { name: 'Technical Focal Point', code: 'TECHNICAL_FOCAL_POINT', category: 'Contact Type', appliesTo: ['Contact'], sortOrder: 44 },
    
    // Company-applicable tags
    { name: 'Port Authority', code: 'PORT_AUTHORITY', category: 'Authority / Compliance', appliesTo: ['Company'], sortOrder: 100 },
    { name: 'Flag State Administration', code: 'FLAG_STATE', category: 'Authority / Compliance', appliesTo: ['Company'], sortOrder: 101 },
    { name: 'Classification Society', code: 'CLASS_SOCIETY', category: 'Authority / Compliance', appliesTo: ['Company'], sortOrder: 102 },
    { name: 'Regulator', code: 'REGULATORY', category: 'Authority / Compliance', appliesTo: ['Company'], sortOrder: 103 },
    { name: 'Environmental Authority', code: 'ENVIRONMENTAL', category: 'Authority / Compliance', appliesTo: ['Company'], sortOrder: 104 },
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const created = [];
      const updated = [];
      const skipped = [];
      const errors = [];

      for (const tagData of systemTagsData) {
        try {
          const existing = existingTags.find(t => t.code === tagData.code);
          
          if (existing) {
            // Update if needed
            const needsUpdate = 
              !existing.isSystem ||
              !existing.isActive ||
              existing.category !== tagData.category ||
              JSON.stringify(existing.appliesTo) !== JSON.stringify(tagData.appliesTo) ||
              existing.sortOrder !== tagData.sortOrder;
            
            if (needsUpdate) {
              await base44.entities.ContactTag.update(existing.id, {
                ...tagData,
                isSystem: true,
                isActive: true
              });
              updated.push(tagData.code);
            } else {
              skipped.push(tagData.code);
            }
          } else {
            // Create new
            await base44.entities.ContactTag.create({
              ...tagData,
              publicId: crypto.randomUUID(),
              tenantId: 'default-tenant',
              isSystem: true,
              isLocked: false,
              isActive: true
            });
            created.push(tagData.code);
          }
        } catch (error) {
          errors.push({ code: tagData.code, error: error.message });
        }
      }

      return { created, updated, skipped, errors };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['contactTags']);
      setResults(data);
      toast.success('System tags seeded successfully');
    },
    onError: (error) => {
      toast.error('Failed to seed tags: ' + error.message);
    }
  });

  const handleSeed = async () => {
    setIsProcessing(true);
    setResults(null);
    await seedMutation.mutateAsync();
    setIsProcessing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('ContactTags')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seed System Tags</h1>
          <p className="text-gray-600 mt-1">Initialize or update system tags</p>
        </div>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">System Tags Seeder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              This will create or update {systemTagsData.length} system tags with proper categories and applicability settings.
            </p>
            <ul className="mt-2 text-sm text-blue-700 list-disc list-inside">
              <li>Contact-applicable tags: {systemTagsData.filter(t => t.appliesTo.includes('Contact')).length}</li>
              <li>Company-applicable tags: {systemTagsData.filter(t => t.appliesTo.includes('Company')).length}</li>
            </ul>
          </div>

          <Button
            onClick={handleSeed}
            disabled={isProcessing || seedMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {isProcessing ? 'Seeding...' : 'Run Seeder'}
          </Button>

          {results && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Results</h3>
                    <ul className="mt-2 text-sm text-green-800 space-y-1">
                      <li>Created: {results.created.length}</li>
                      <li>Updated: {results.updated.length}</li>
                      <li>Skipped (already correct): {results.skipped.length}</li>
                      <li>Errors: {results.errors.length}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {results.created.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Created Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.created.map(code => (
                      <code key={code} className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {results.updated.length > 0 && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Updated Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {results.updated.map(code => (
                      <code key={code} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {code}
                      </code>
                    ))}
                  </div>
                </div>
              )}

              {results.errors.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900 mb-2">Errors</h4>
                      <ul className="text-sm text-red-800 space-y-1">
                        {results.errors.map((err, idx) => (
                          <li key={idx}>{err.code}: {err.error}</li>
                        ))}
                      </ul>
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