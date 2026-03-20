import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ruler, Anchor } from 'lucide-react';

export default function VesselDimensionsView({ vessel }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Ruler className="w-5 h-5 text-cyan-400" />
            Principal Dimensions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">LOA (m)</span>
            <span className="text-gray-900 font-medium">{vessel.loa_m || vessel.loa ? parseFloat(vessel.loa_m || vessel.loa).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Width (m)</span>
            <span className="text-gray-900 font-medium">{vessel.width_m ? parseFloat(vessel.width_m).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Beam (m)</span>
            <span className="text-gray-900 font-medium">{vessel.beam_m || vessel.beam ? parseFloat(vessel.beam_m || vessel.beam).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Depth (m)</span>
            <span className="text-gray-900 font-medium">{vessel.depth_m ? parseFloat(vessel.depth_m).toLocaleString() : '-'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Anchor className="w-5 h-5 text-cyan-400" />
            Draft & Displacement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Design Draft (m)</span>
            <span className="text-gray-900 font-medium">{vessel.designDraft_m ? parseFloat(vessel.designDraft_m).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Max Draft (m)</span>
            <span className="text-gray-900 font-medium">{vessel.maxDraft_m || vessel.draft ? parseFloat(vessel.maxDraft_m || vessel.draft).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Air Draft (m)</span>
            <span className="text-gray-900 font-medium">{vessel.airDraft_m ? parseFloat(vessel.airDraft_m).toLocaleString() : '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Displacement (t)</span>
            <span className="text-gray-900 font-medium">{vessel.displacementSummer_t ? vessel.displacementSummer_t.toLocaleString() : '-'}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}