import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ChangeTerminalStatusDialog({ open, onOpenChange, terminal, onSave }) {
  const [status, setStatus] = useState(terminal?.status || 'Operational');

  useEffect(() => {
    if (terminal) {
      setStatus(terminal.status || 'Operational');
    }
  }, [terminal]);

  const handleSave = () => {
    onSave(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Change Terminal Status</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Under Construction">Under Construction</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}