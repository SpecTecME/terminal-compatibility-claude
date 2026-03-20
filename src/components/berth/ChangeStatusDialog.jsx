import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function ChangeStatusDialog({ open, onOpenChange, berth, onSave }) {
  const [status, setStatus] = useState(berth?.status || 'Operational');

  useEffect(() => {
    if (berth) {
      setStatus(berth.status || 'Operational');
    }
  }, [berth]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(status);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-gray-900">Change Berth Status</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-700">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Operational">Operational</SelectItem>
                <SelectItem value="Maintenance">Maintenance</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Planned">Planned</SelectItem>
                <SelectItem value="Under Construction">Under Construction</SelectItem>
              </SelectContent>
            </Select>
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
              className="bg-gradient-to-r from-cyan-500 to-blue-600"
            >
              Update Status
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}