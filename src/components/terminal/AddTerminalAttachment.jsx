import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { generateUUID } from '../utils/uuid';
import { getCurrentTenantId } from '../utils/tenant';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';
import { Upload, Loader2 } from 'lucide-react';

export default function AddTerminalAttachment({ open, onOpenChange, terminal, attachmentType }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [attachment, setAttachment] = useState({
    name: '',
    file_url: '',
    validFrom: '',
    validTo: '',
    status: 'Draft',
    sortOrder: '',
    notes: ''
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const data = {
        publicId: generateUUID(),
        tenantId: getCurrentTenantId(),
        terminalId: terminal.id,
        terminalPublicId: terminal.publicId,
        attachmentType,
        ...attachment,
        sortOrder: attachment.sortOrder ? parseInt(attachment.sortOrder) : null
      };
      return base44.entities.TerminalAttachment.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminalAttachments', terminal.id]);
      toast.success('Attachment added successfully');
      onOpenChange(false);
      setAttachment({
        name: '',
        file_url: '',
        validFrom: '',
        validTo: '',
        status: 'Draft',
        sortOrder: '',
        notes: ''
      });
    },
    onError: (error) => {
      toast.error('Failed to add attachment: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setAttachment({ ...attachment, file_url: result.file_url });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!attachment.name || !attachment.file_url) {
      toast.error('Name and file are required');
      return;
    }
    createMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Add {attachmentType}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                required
                value={attachment.name}
                onChange={(e) => setAttachment({ ...attachment, name: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
                placeholder="e.g., Safety Procedure 2024"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Upload File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="bg-white border-gray-300 text-gray-900"
                />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />}
              </div>
              {attachment.file_url && (
                <p className="text-xs text-emerald-600">✓ File uploaded</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Valid From</Label>
                <Input
                  type="date"
                  value={attachment.validFrom}
                  onChange={(e) => setAttachment({ ...attachment, validFrom: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Valid To</Label>
                <Input
                  type="date"
                  value={attachment.validTo}
                  onChange={(e) => setAttachment({ ...attachment, validTo: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Status *</Label>
                <Select 
                  value={attachment.status}
                  onValueChange={(v) => setAttachment({ ...attachment, status: v })}
                >
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200">
                    <SelectItem value="Draft" className="text-gray-900">Draft</SelectItem>
                    <SelectItem value="Active" className="text-gray-900">Active</SelectItem>
                    <SelectItem value="Superseded" className="text-gray-900">Superseded</SelectItem>
                    <SelectItem value="Archived" className="text-gray-900">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={attachment.sortOrder}
                  onChange={(e) => setAttachment({ ...attachment, sortOrder: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                  placeholder="Optional"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={attachment.notes}
                onChange={(e) => setAttachment({ ...attachment, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 min-h-[100px]"
                placeholder="Additional notes about this attachment..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-gray-300"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={createMutation.isPending || uploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Add Attachment
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}