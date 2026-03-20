import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, MapPin, Phone, Mail, Edit, Trash2, Globe } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import SearchableSelect from '../ui/SearchableSelect';
import { toast } from 'sonner';
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

export default function CompanyOfficesTab({ companyId, companyPublicId }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingOffice, setEditingOffice] = useState(null);
  const [deletingOffice, setDeletingOffice] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: offices = [] } = useQuery({
    queryKey: ['companyOffices', companyId],
    queryFn: () => base44.entities.CompanyOffice.filter({ companyId }),
    enabled: !!companyId
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const { data: legalEntities = [] } = useQuery({
    queryKey: ['companyLegalEntities', companyId],
    queryFn: () => base44.entities.CompanyLegalEntity.filter({ companyId }),
    enabled: !!companyId
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyOffice.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      companyId,
      companyPublicId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyOffices']);
      setShowDialog(false);
      setFormData({});
      toast.success('Office added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyOffice.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyOffices']);
      setShowDialog(false);
      setEditingOffice(null);
      setFormData({});
      toast.success('Office updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyOffice.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyOffices']);
      setDeletingOffice(null);
      toast.success('Office deleted');
    }
  });

  const handleAdd = () => {
    setEditingOffice(null);
    setFormData({
      officeName: '',
      countryId: '',
      city: '',
      addressLine1: '',
      postalCode: '',
      timezone: '',
      phone: '',
      email: '',
      isHQ: false,
      isActive: true,
      legalEntityId: '',
      notes: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (office) => {
    setEditingOffice(office);
    setFormData(office);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.officeName) {
      toast.error('Office name is required');
      return;
    }

    const country = countries.find(c => c.id === formData.countryId);
    const legalEntity = legalEntities.find(le => le.id === formData.legalEntityId);

    const payload = {
      ...formData,
      countryPublicId: country?.publicId || null,
      legalEntityPublicId: legalEntity?.publicId || null
    };

    if (editingOffice) {
      updateMutation.mutate({ id: editingOffice.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Offices</h3>
        <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Office
        </Button>
      </div>

      {offices.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offices</h3>
            <p className="text-gray-600 mb-4">Add company offices and locations</p>
            <Button onClick={handleAdd} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Office
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {offices.map((office) => {
            const country = countries.find(c => c.id === office.countryId);
            return (
              <Card key={office.id} className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold text-gray-900 flex items-center gap-2">
                      {office.officeName}
                      {office.isHQ && (
                        <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 border text-xs">
                          HQ
                        </Badge>
                      )}
                    </CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(office)} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingOffice(office)} className="h-8 w-8">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {office.city && country && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{office.city}, {country.nameEn}</span>
                    </div>
                  )}
                  {office.phone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{office.phone}</span>
                    </div>
                  )}
                  {office.email && (
                    <div className="flex items-start gap-2 text-sm">
                      <Mail className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{office.email}</span>
                    </div>
                  )}
                  {office.timezone && (
                    <div className="flex items-start gap-2 text-sm">
                      <Globe className="w-4 h-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700">{office.timezone}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingOffice ? 'Edit Office' : 'Add Office'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Office Name *</Label>
              <Input
                value={formData.officeName || ''}
                onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                placeholder="e.g., Singapore Office"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <SearchableSelect
                  value={formData.countryId || ''}
                  onValueChange={(v) => setFormData({ ...formData, countryId: v })}
                  options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                  placeholder="Select country"
                  searchPlaceholder="Search countries..."
                />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input
                  value={formData.city || ''}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={formData.addressLine1 || ''}
                onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Postal Code</Label>
                <Input
                  value={formData.postalCode || ''}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input
                  value={formData.timezone || ''}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  placeholder="e.g., Asia/Singapore"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {legalEntities.length > 0 && (
              <div className="space-y-2">
                <Label>Legal Entity</Label>
                <SearchableSelect
                  value={formData.legalEntityId || ''}
                  onValueChange={(v) => setFormData({ ...formData, legalEntityId: v })}
                  options={legalEntities.map(le => ({ value: le.id, label: le.legalEntityName }))}
                  placeholder="Select legal entity (optional)"
                  searchPlaceholder="Search legal entities..."
                />
              </div>
            )}

            <div className="flex items-center gap-2">
              <Checkbox
                id="isHQ"
                checked={formData.isHQ || false}
                onCheckedChange={(c) => setFormData({ ...formData, isHQ: c })}
              />
              <Label htmlFor="isHQ" className="cursor-pointer">This is the headquarters</Label>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingOffice ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingOffice} onOpenChange={() => setDeletingOffice(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Office</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingOffice?.officeName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingOffice.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}