import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { generateUUID } from '../components/utils/uuid';

export default function SeedContactTags() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  const systemTags = [
    { name: 'Security', code: 'SECURITY', category: 'Critical' },
    { name: 'Safety', code: 'SAFETY', category: 'Critical' },
    { name: 'HSSE', code: 'HSSE', category: 'Critical' },
    { name: 'Operations', code: 'OPERATIONS', category: 'Functional' },
    { name: 'Vessel Registration', code: 'VESSEL_REGISTRATION', category: 'Functional' },
    { name: 'Documentation Renewal', code: 'DOCUMENTATION_RENEWAL', category: 'Functional' },
    { name: 'Vetting', code: 'VETTING', category: 'Functional' },
    { name: 'Group Mailbox', code: 'GROUP_MAILBOX', category: 'Type' },
    { name: 'Emergency 24/7', code: 'EMERGENCY_24_7', category: 'Availability' }
  ];

  const handleSeed = async () => {
    setProcessing(true);
    try {
      const existing = await base44.entities.ContactTag.list();
      const existingCodes = existing.map(t => t.code);
      
      const newTags = systemTags.filter(t => !existingCodes.includes(t.code));
      
      if (newTags.length === 0) {
        setResults({ created: 0, skipped: systemTags.length });
        toast.info('All system tags already exist');
        return;
      }

      const tagsToCreate = newTags.map((tag, idx) => ({
        publicId: generateUUID(),
        tenantId: 'default-tenant',
        name: tag.name,
        code: tag.code,
        category: tag.category,
        isSystem: true,
        isLocked: true,
        isActive: true,
        sortOrder: idx
      }));

      await base44.entities.ContactTag.bulkCreate(tagsToCreate);
      
      setResults({ created: newTags.length, skipped: systemTags.length - newTags.length });
      toast.success(`Created ${newTags.length} system tags`);
    } catch (error) {
      toast.error('Failed to seed tags: ' + error.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Contact Tags</h1>
        <p className="text-gray-600 mt-1">Create system contact tags</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">System Tags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {systemTags.map(tag => (
              <div key={tag.code} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div>
                  <p className="font-medium text-gray-900">{tag.name}</p>
                  <p className="text-sm text-gray-600">{tag.code} • {tag.category}</p>
                </div>
              </div>
            ))}
          </div>

          <Button
            onClick={handleSeed}
            disabled={processing}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            {processing ? 'Seeding...' : 'Seed Tags'}
          </Button>

          {results && (
            <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <p className="font-medium text-emerald-900">Seeding Complete</p>
              </div>
              <p className="text-sm text-emerald-700">Created: {results.created} tags</p>
              <p className="text-sm text-emerald-700">Skipped: {results.skipped} (already exist)</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}