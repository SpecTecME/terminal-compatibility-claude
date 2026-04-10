import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Edit, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import ExternalCodesSection from '../components/documenttype/ExternalCodesSection';

export default function DocumentTypeDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const docTypeId = urlParams.get('id');

  const { data: docType, isLoading } = useQuery({
    queryKey: ['documentType', docTypeId],
    queryFn: () => base44.entities.DocumentType.filter({ id: docTypeId }).then(r => r[0]),
    enabled: !!docTypeId
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: () => base44.entities.DocumentCategory.list()
  });

  if (isLoading || !docType) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const category = categories.find(c => c.id === docType.categoryId);

  const validityTypeLabels = {
    'PermanentStatic': 'Permanent Static',
    'TerminalEventDriven': 'Terminal Event Driven',
    'RenewableCertified': 'Renewable Certified',
    'VettingTimeSensitive': 'Vetting Time Sensitive'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{docType.name}</h1>
            <p className="text-gray-600 mt-1">Document Type Details</p>
          </div>
        </div>
        <Link to={createPageUrl(`EditDocumentType?id=${docTypeId}`)}>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-600">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
        </Link>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            General Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Name</p>
              <p className="text-gray-900 font-medium mt-1">{docType.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Code</p>
              <p className="text-gray-900 font-medium mt-1">{docType.code || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-gray-900 font-medium mt-1">{category?.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Applies To</p>
              <p className="text-gray-900 font-medium mt-1">{docType.appliesTo || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Validity Type</p>
              <p className="text-gray-900 font-medium mt-1">
                {validityTypeLabels[docType.documentValidityType] || docType.documentValidityType || '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={`${docType.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'} border mt-1`}>
                {docType.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Validity & Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Expiry Required</p>
              <p className="text-gray-900 font-medium mt-1">{docType.isExpiryRequired ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Default Validity Duration</p>
              <p className="text-gray-900 font-medium mt-1">
                {docType.defaultValidityDuration ? `${docType.defaultValidityDuration} ${docType.validityUnit}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reminder Lead Time</p>
              <p className="text-gray-900 font-medium mt-1">
                {docType.reminderLeadTime ? `${docType.reminderLeadTime} ${docType.reminderUnit}` : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Sort Order</p>
              <p className="text-gray-900 font-medium mt-1">{docType.sortOrder || '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Issuing Authority</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Default Authority</p>
              <p className="text-gray-900 font-medium mt-1">{docType.issuingAuthorityDefault || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Allowed Issuers</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {docType.allowedIssuers && docType.allowedIssuers.length > 0 ? (
                  docType.allowedIssuers.map((issuer, idx) => (
                    <Badge key={idx} variant="outline" className="border-gray-300 text-gray-700 text-xs">
                      {issuer}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-900 font-medium">-</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {(docType.description || docType.notes) && (
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {docType.description && (
              <div>
                <p className="text-sm text-gray-600 mb-2">Description</p>
                <p className="text-gray-900">{docType.description}</p>
              </div>
            )}
            {docType.notes && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-2">Notes</p>
                <p className="text-gray-900">{docType.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <ExternalCodesSection documentType={docType} />

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Created</p>
              <p className="text-gray-900 font-medium mt-1">
                {docType.created_date ? format(new Date(docType.created_date), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-gray-900 font-medium mt-1">
                {docType.updated_date ? format(new Date(docType.updated_date), 'MMM d, yyyy HH:mm') : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}