import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Info } from 'lucide-react';

export default function SetBerthStatusesDialog({ 
  open, 
  onOpenChange, 
  berths = [], 
  defaultStatus = 'Operational',
  title = "Update Berth Statuses",
  description = "Set the status for each berth:",
  onSave 
}) {
  const [berthStatuses, setBerthStatuses] = useState({});

  useEffect(() => {
    if (berths.length > 0) {
      const initialStatuses = {};
      berths.forEach(berth => {
        initialStatuses[berth.id] = defaultStatus;
      });
      setBerthStatuses(initialStatuses);
    }
  }, [berths, defaultStatus]);

  const handleSave = () => {
    onSave(berthStatuses);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-gray-200 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-gray-900">{title}</DialogTitle>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-800">
              {berths.length} berth{berths.length > 1 ? 's' : ''} will be updated
            </p>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {berths.map((berth) => (
              <div key={berth.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">
                    {berth.berthName || berth.berth_name || berth.berthCode || berth.berth_number}
                  </p>
                </div>
                <div className="w-48">
                  <Select 
                    value={berthStatuses[berth.id] || defaultStatus} 
                    onValueChange={(value) => setBerthStatuses({...berthStatuses, [berth.id]: value})}
                  >
                    <SelectTrigger className="bg-white border-gray-300 text-gray-900 text-sm">
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
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300">
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-cyan-500 to-blue-600">
            Update Statuses
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}