import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, FileText, Edit, Trash2, MapPin } from 'lucide-react';
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

export default function CompanyLegalEntitiesTab({ companyId, companyPublicId }) {
  const queryClient = useQueryClient();
  const [showDialog, setShowDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState(null);
  const [deletingEntity, setDeletingEntity] = useState(null);
  const [formData, setFormData] = useState({});

  const { data: legalEntities = [] } = useQuery({
    queryKey: ['companyLegalEntities', companyId],
    queryFn: () => base44.entities.CompanyLegalEntity.filter({ companyId }),
    enabled: !!companyId
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['countries'],
    queryFn: () => base44.entities.Country.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.CompanyLegalEntity.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      companyId,
      companyPublicId
    }),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyLegalEntities']);
      setShowDialog(false);
      setFormData({});
      toast.success('Legal entity added');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.CompanyLegalEntity.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyLegalEntities']);
      setShowDialog(false);
      setEditingEntity(null);
      setFormData({});
      toast.success('Legal entity updated');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.CompanyLegalEntity.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['companyLegalEntities']);
      setDeletingEntity(null);
      toast.success('Legal entity deleted');
    }
  });

  const handleAdd = () => {
    setEditingEntity(null);
    setFormData({
      legalEntityName: '',
      registrationNo: '',
      taxNo: '',
      vatNo: '',
      countryId: '',
      legalAddressLine1: '',
      legalCity: '',
      legalPostalCode: '',
      legalCountryId: '',
      billingSameAsLegal: true,
      billingAddressLine1: '',
      billingCity: '',
      billingPostalCode: '',
      billingCountryId: '',
      isActive: true,
      notes: ''
    });
    setShowDialog(true);
  };

  const handleEdit = (entity) => {
    setEditingEntity(entity);
    setFormData(entity);
    setShowDialog(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.legalEntityName) {
      toast.error('Legal entity name is required');
      return;
    }

    const country = countries.find(c => c.id === formData.countryId);
    const payload = {
      ...formData,
      countryPublicId: country?.publicId || null
    };

    if (editingEntity) {
      updateMutation.mutate({ id: editingEntity.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Legal Entities</h3>
        <Button onClick={handleAdd} size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Add Legal Entity
        </Button>
      </div>

      {legalEntities.length === 0 ? (
        <Card className="bg-white border-gray-200">
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No legal entities</h3>
            <p className="text-gray-600 mb-4">Add legal entities for corporate structure</p>
            <Button onClick={handleAdd} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Legal Entity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {legalEntities.map((entity) => {
            const country = countries.find(c => c.id === entity.countryId);
            const legalCountry = countries.find(c => c.id === entity.legalCountryId);
            return (
              <Card key={entity.id} className="bg-white border-gray-200">
                <CardHeader className="flex flex-row items-start justify-between pb-3">
                  <CardTitle className="text-base font-semibold text-gray-900">
                    {entity.legalEntityName}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(entity)} className="h-8 w-8">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeletingEntity(entity)} className="h-8 w-8">
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid md:grid-cols-3 gap-4">
                    {entity.registrationNo && (
                      <div>
                        <p className="text-xs text-gray-600">Registration No</p>
                        <p className="text-sm text-gray-900">{entity.registrationNo}</p>
                      </div>
                    )}
                    {entity.taxNo && (
                      <div>
                        <p className="text-xs text-gray-600">Tax No</p>
                        <p className="text-sm text-gray-900">{entity.taxNo}</p>
                      </div>
                    )}
                    {entity.vatNo && (
                      <div>
                        <p className="text-xs text-gray-600">VAT No</p>
                        <p className="text-sm text-gray-900">{entity.vatNo}</p>
                      </div>
                    )}
                  </div>
                  {(entity.legalCity || legalCountry) && (
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Legal Address</p>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-gray-500 mt-0.5" />
                        <span className="text-sm text-gray-700">
                          {[entity.legalCity, legalCountry?.nameEn].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-white border-gray-200 max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingEntity ? 'Edit Legal Entity' : 'Add Legal Entity'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Legal Entity Name *</Label>
              <Input
                value={formData.legalEntityName || ''}
                onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                required
              />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Registration No</Label>
                <Input
                  value={formData.registrationNo || ''}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Tax No</Label>
                <Input
                  value={formData.taxNo || ''}
                  onChange={(e) => setFormData({ ...formData, taxNo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>VAT No</Label>
                <Input
                  value={formData.vatNo || ''}
                  onChange={(e) => setFormData({ ...formData, vatNo: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Country of Incorporation</Label>
              <SearchableSelect
                value={formData.countryId || ''}
                onValueChange={(v) => setFormData({ ...formData, countryId: v })}
                options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                placeholder="Select country"
                searchPlaceholder="Search countries..."
              />
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-900 mb-3">Legal Address</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input
                    value={formData.legalAddressLine1 || ''}
                    onChange={(e) => setFormData({ ...formData, legalAddressLine1: e.target.value })}
                  />
                </div>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={formData.legalCity || ''}
                      onChange={(e) => setFormData({ ...formData, legalCity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input
                      value={formData.legalPostalCode || ''}
                      onChange={(e) => setFormData({ ...formData, legalPostalCode: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <SearchableSelect
                      value={formData.legalCountryId || ''}
                      onValueChange={(v) => setFormData({ ...formData, legalCountryId: v })}
                      options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                      placeholder="Select country"
                      searchPlaceholder="Search..."
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Checkbox
                  id="billingSameAsLegal"
                  checked={formData.billingSameAsLegal}
                  onCheckedChange={(c) => setFormData({ ...formData, billingSameAsLegal: c })}
                />
                <Label htmlFor="billingSameAsLegal" className="cursor-pointer">
                  Billing address same as legal address
                </Label>
              </div>

              {!formData.billingSameAsLegal && (
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-900">Billing Address</h4>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input
                      value={formData.billingAddressLine1 || ''}
                      onChange={(e) => setFormData({ ...formData, billingAddressLine1: e.target.value })}
                    />
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>City</Label>
                      <Input
                        value={formData.billingCity || ''}
                        onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Postal Code</Label>
                      <Input
                        value={formData.billingPostalCode || ''}
                        onChange={(e) => setFormData({ ...formData, billingPostalCode: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Country</Label>
                      <SearchableSelect
                        value={formData.billingCountryId || ''}
                        onValueChange={(v) => setFormData({ ...formData, billingCountryId: v })}
                        options={countries.map(c => ({ value: c.id, label: c.nameEn }))}
                        placeholder="Select country"
                        searchPlaceholder="Search..."
                      />
                    </div>
                  </div>
                </div>
              )}
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
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingEntity ? 'Update' : 'Add'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingEntity} onOpenChange={() => setDeletingEntity(null)}>
        <AlertDialogContent className="bg-white border-gray-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Legal Entity</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingEntity?.legalEntityName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate(deletingEntity.id)}
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