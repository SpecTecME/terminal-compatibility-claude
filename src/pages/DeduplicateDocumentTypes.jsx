import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { ArrowLeft, Trash2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

export default function DeduplicateDocumentTypes() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: allDocumentTypes = [], isLoading } = useQuery({
    queryKey: ['allDocumentTypes'],
    queryFn: () => base44.entities.DocumentType.list()
  });

  // Group by name to find duplicates
  const groupedByName = allDocumentTypes.reduce((acc, doc) => {
    if (!acc[doc.name]) {
      acc[doc.name] = [];
    }
    acc[doc.name].push(doc);
    return acc;
  }, {});

  // Filter only groups with duplicates
  const duplicates = Object.entries(groupedByName).filter(([_, docs]) => docs.length > 1);

  const deleteDocumentTypeMutation = useMutation({
    mutationFn: (id) => base44.entities.DocumentType.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allDocumentTypes'] });
      toast.success('DocumentType deleted');
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error('Failed to delete: ' + error.message);
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to={createPageUrl('DocumentTypes')}>
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deduplicate Document Types</h1>
          <p className="text-gray-600 mt-1">Found {duplicates.length} document types with duplicates</p>
        </div>
      </div>

      {duplicates.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No Duplicates Found</h3>
            <p className="text-gray-600 mt-2">Your DocumentType table is clean!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {duplicates.map(([name, docs]) => (
            <Card key={name} className="bg-white border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900">
                  {name}
                  <Badge className="ml-3 bg-red-500/10 text-red-400 border-red-500/30">
                    {docs.length} copies
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {docs.map((doc) => (
                    <div key={doc.id} className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-gray-600">Code</p>
                          <p className="font-medium text-gray-900">{doc.code || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Category</p>
                          <p className="font-medium text-gray-900">{doc.categoryId ? '✓' : '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Validity Type</p>
                          <p className="font-medium text-gray-900">{doc.documentValidityType || '-'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-600">Duration</p>
                          <p className="font-medium text-gray-900">
                            {doc.defaultValidityDuration ? `${doc.defaultValidityDuration} ${doc.validityUnit}` : '-'}
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                        <Badge className={doc.isActive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-gray-500/10 text-gray-400 border-gray-500/30'}>
                          {doc.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeletingId(doc.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-900">Delete DocumentType</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600">
              Are you sure? This will permanently delete this DocumentType record. Make sure you're keeping the one with complete data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-300">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteDocumentTypeMutation.mutate(deletingId)}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteDocumentTypeMutation.isPending}
            >
              {deleteDocumentTypeMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}