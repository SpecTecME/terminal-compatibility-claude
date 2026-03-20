import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle } from 'lucide-react';

export default function ArchiveTerminalDialog({ open, onOpenChange, terminal, onArchive, berthCount = 0 }) {
  const [reason, setReason] = useState('');

  const handleArchive = () => {
    onArchive(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Archive Terminal</DialogTitle>
          <DialogDescription className="text-gray-600">
            This terminal has related data (berths, vessels, requirements). It cannot be permanently deleted but can be archived instead.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div className="text-sm text-amber-800">
              <p>Archiving this terminal will:</p>
              <ul className="list-disc ml-4 mt-1">
                <li>Set terminal status to Inactive</li>
                {berthCount > 0 && <li>Archive and inactivate {berthCount} associated berth{berthCount > 1 ? 's' : ''}</li>}
                <li>Hide it from default lists (can be restored later)</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <Label className="text-gray-700">Archive Reason (Optional)</Label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this terminal being archived?"
              className="bg-white border-gray-300 text-gray-900"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleArchive} className="bg-amber-600 hover:bg-amber-700">
            Archive Terminal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}