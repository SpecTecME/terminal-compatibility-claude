import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Save, Loader2, Upload } from 'lucide-react';

export default function EditTerminalAttachment({ open, onOpenChange, attachment, terminal }) {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    file_url: '',
    validFrom: '',
    validTo: '',
    status: 'Draft',
    sortOrder: '',
    notes: ''
  });

  useEffect(() => {
    if (attachment) {
      setFormData({
        name: attachment.name || '',
        file_url: attachment.file_url || '',
        validFrom: attachment.validFrom || '',
        validTo: attachment.validTo || '',
        status: attachment.status || 'Draft',
        sortOrder: attachment.sortOrder?.toString() || '',
        notes: attachment.notes || ''
      });
    }
  }, [attachment]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const data = {
        ...formData,
        sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : null
      };
      return base44.entities.TerminalAttachment.update(attachment.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['terminalAttachments', terminal.id]);
      toast.success('Attachment updated successfully');
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error('Failed to update attachment: ' + error.message);
    }
  });

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, file_url: result.file_url });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload file: ' + error.message);
    }
    setUploading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.file_url) {
      toast.error('Name and file are required');
      return;
    }
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Edit Attachment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Name *</Label>
              <Input
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Upload New File (optional)</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="bg-white border-gray-300 text-gray-900"
                />
                {uploading && <Loader2 className="w-4 h-4 animate-spin text-cyan-600" />}
              </div>
              {formData.file_url && (
                <p className="text-xs text-gray-600">Current file: {formData.file_url.split('/').pop()}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Valid From</Label>
                <Input
                  type="date"
                  value={formData.validFrom}
                  onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Valid To</Label>
                <Input
                  type="date"
                  value={formData.validTo}
                  onChange={(e) => setFormData({ ...formData, validTo: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Status *</Label>
                <Select 
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
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
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: e.target.value })}
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="bg-white border-gray-300 text-gray-900 min-h-[100px]"
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
              disabled={updateMutation.isPending || uploading}
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}