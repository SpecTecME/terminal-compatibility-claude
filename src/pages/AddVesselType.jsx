/**
 * Add Vessel Type Page
 * 
 * PURPOSE:
 * Create new vessel type classifications with two-level hierarchy.
 * Defines vessel categories and their characteristic specifications.
 * 
 * TWO-LEVEL HIERARCHY:
 * 
 * PRIMARY TYPE (line 73-80):
 * - Functional category (purpose/cargo)
 * - Examples: "LNG Carrier", "Oil Tanker (Crude)", "Container Ship"
 * - REQUIRED
 * - Broad classification
 * 
 * SUB-TYPE (line 82-91):
 * - Size class or design variant
 * - Examples: "Q-Max", "Suezmax", "Post-Panamax"
 * - REQUIRED
 * - Refines primary type
 * 
 * COMBINATION EXAMPLES:
 * - "LNG Carrier" + "Q-Max" = Largest LNG carriers (Qatar-specific)
 * - "Oil Tanker (Crude)" + "VLCC" = Very Large Crude Carrier
 * - "Container Ship" + "Ultra Large" = 20,000+ TEU megaships
 * 
 * SIZE METRIC (line 95-107):
 * Measurement standard for this vessel type.
 * 
 * OPTIONS (line 49):
 * - DWT: Deadweight Tonnage (tankers, bulk carriers)
 * - TEU: Twenty-foot Equivalent Units (container ships)
 * - m3: Cubic meters (gas carriers)
 * - pax: Passengers (cruise/ferry)
 * - LOA_m: Length Overall (some specialized vessels)
 * - CEU: Car Equivalent Units (car carriers)
 * - BHP: Brake Horsepower (tugs, workboats)
 * - BP: Bollard Pull (tugs)
 * - Others: volume, tonnes, lane_meters, class
 * 
 * TYPICAL SIZE RANGE (line 108-116):
 * Range specification using selected metric.
 * 
 * EXAMPLES:
 * - Q-Max (m3): "266,000–270,000"
 * - Suezmax (DWT): "120,000–200,000"
 * - Post-Panamax (TEU): "5,000–14,999"
 * 
 * FORMAT:
 * Free-text (no validation).
 * Accepts ranges, single values, descriptions.
 * 
 * DEFINING CHARACTERISTICS (line 119-128):
 * Free-text description of what makes this type unique.
 * 
 * EXAMPLES:
 * - Q-Max: "World's largest LNG carriers, membrane containment, Qatar Petroleum specification"
 * - FSRU: "Floating storage and regasification, onboard regasification plant"
 * 
 * HELPS USERS:
 * Understand vessel type without external research.
 * Captures institutional knowledge.
 * 
 * CAPABILITIES SECTIONS (line 130-139):
 * Comma-separated list of capability categories.
 * 
 * EXAMPLES:
 * - LNG Carrier: "Cargo System,Manifold,Mooring,Fender,Environmental"
 * - Container Ship: "Cargo Handling,Mooring,Fender" (no manifold)
 * - Passenger Ship: "Passenger Facilities,Safety Equipment,Mooring"
 * 
 * PURPOSE:
 * Drives which tabs/sections appear in vessel detail pages.
 * Dynamic UI generation based on vessel type.
 * 
 * SORT ORDER (line 141-151):
 * Controls display order in vessel type dropdowns.
 * Common types first (LNG carriers, oil tankers).
 * Specialized types later (FSRUs, special-purpose vessels).
 * 
 * STATUS (line 152-163):
 * Active by default (line 25).
 * Can create inactive if preparing data.
 * 
 * DEFAULT VALUES (lines 17-26):
 * All fields empty except isActive=true.
 * No assumptions about vessel type characteristics.
 * User fills all relevant fields.
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddVesselType() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    primaryType: '',
    subType: '',
    sizeMetric: '',
    typicalSizeRange: '',
    definingCharacteristics: '',
    capabilitiesSections: '',
    sortOrder: '',
    isActive: true
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.VesselTypeRef.create({
      ...data,
      publicId: crypto.randomUUID(),
      tenantId: 'default-tenant',
      sortOrder: data.sortOrder ? parseInt(data.sortOrder) : null
    }),
    onSuccess: () => {
      toast.success('Vessel type created');
      navigate(createPageUrl('VesselTypes'));
    },
    onError: (error) => {
      toast.error('Failed to create: ' + error.message);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const sizeMetrics = ['DWT', 'TEU', 'm3', 'pax', 'LOA_m', 'BHP', 'BP', 'volume', 'tonnes', 'lane_meters', 'CEU', 'class'];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vessel Type</h1>
          <p className="text-sm text-gray-600 mt-1">Create a new vessel type reference</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Vessel Type Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Primary Type *</Label>
                <Input
                  value={formData.primaryType}
                  onChange={(e) => setFormData({...formData, primaryType: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="e.g., Oil Tanker (Crude)"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Sub-Type / Size Class *</Label>
                <Input
                  value={formData.subType}
                  onChange={(e) => setFormData({...formData, subType: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="e.g., Suezmax"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Size Metric</Label>
                <Select value={formData.sizeMetric} onValueChange={(value) => setFormData({...formData, sizeMetric: value})}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue placeholder="Select size metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizeMetrics.map(metric => (
                      <SelectItem key={metric} value={metric}>{metric}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Typical Size Range</Label>
                <Input
                  value={formData.typicalSizeRange}
                  onChange={(e) => setFormData({...formData, typicalSizeRange: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="e.g., 120,000–200,000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Defining Characteristics</Label>
              <Textarea
                value={formData.definingCharacteristics}
                onChange={(e) => setFormData({...formData, definingCharacteristics: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="Key characteristics..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-700">Capabilities Sections</Label>
              <Input
                value={formData.capabilitiesSections}
                onChange={(e) => setFormData({...formData, capabilitiesSections: e.target.value})}
                className="bg-white border-gray-300"
                placeholder="e.g., Cargo Capability, Tanker Systems"
              />
              <p className="text-xs text-gray-500">Comma-separated list</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Sort Order</Label>
                <Input
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({...formData, sortOrder: e.target.value})}
                  className="bg-white border-gray-300"
                  placeholder="Optional"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-700">Status</Label>
                <Select value={formData.isActive.toString()} onValueChange={(value) => setFormData({...formData, isActive: value === 'true'})}>
                  <SelectTrigger className="bg-white border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3 mt-6">
          <Link to={createPageUrl('VesselTypes')}>
            <Button type="button" variant="outline" className="border-gray-300">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Vessel Type'}
          </Button>
        </div>
      </form>
    </div>
  );
}