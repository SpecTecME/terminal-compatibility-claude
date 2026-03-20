import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function ArchiveBerthDialog({ open, onOpenChange, berth, onArchive }) {
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onArchive(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Archive Berth</DialogTitle>
          <DialogDescription className="text-gray-600">
            This berth is linked to activity and cannot be permanently deleted. Archive it to hide it from default views while preserving all data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Reason for Archiving (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="bg-white border-gray-300 text-gray-900"
              placeholder="e.g., Berth decommissioned, replaced by new berth..."
              rows={3}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
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
              className="bg-gradient-to-r from-amber-500 to-orange-600"
            >
              Archive Berth
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}