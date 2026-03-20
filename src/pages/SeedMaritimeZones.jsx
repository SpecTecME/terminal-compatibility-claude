/**
 * Seed Maritime Zones with GeoJSON
 * 
 * PURPOSE:
 * Populate MaritimeZone entity with regulatory zone boundaries.
 * Enables map overlay visualization for compliance and route planning.
 * 
 * ZONES SEEDED:
 * - ECA_SECA: Sulfur Emission Control Areas
 * - ECA_NECA: NOx Emission Control Areas  
 * - PIRACY_HRA: High Risk Areas for piracy
 * - MARPOL_SPECIAL_AREA: MARPOL special areas
 * - WAR_RISK: War risk zones
 * - COMPANY_TRADING_AREA: Company-defined trading areas (empty placeholder)
 */
import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function SeedMaritimeZones() {
  const queryClient = useQueryClient();
  const [result, setResult] = useState(null);

  const maritimeZonesData = [
    {
      code: 'ECA_SECA',
      name: 'ECA SECA',
      zoneType: 'ECA_SECA',
      authority: 'IMO',
      status: 'Active',
      isActive: true,
      displayOrder: 1,
      color: '#FF6B6B',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'MultiPolygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "ECA_SECA",
        "features": [
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_SECA", "zoneName": "Baltic Sea SECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[10.5,53.5],[14.0,54.0],[18.0,54.5],[22.0,55.5],[26.0,59.5],[30.0,60.0],[31.0,65.5],[24.0,66.0],[21.0,65.5],[18.0,64.0],[15.0,62.0],[12.0,59.0],[10.0,56.5],[9.5,54.5],[10.5,53.5]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_SECA", "zoneName": "North Sea SECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-4.0,48.5],[1.0,49.5],[4.0,51.0],[6.0,53.0],[8.5,54.5],[9.0,57.0],[8.0,58.5],[5.0,60.0],[1.0,61.5],[-3.0,60.0],[-5.0,58.0],[-6.0,56.0],[-5.0,53.0],[-4.5,51.0],[-4.0,48.5]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_SECA", "zoneName": "North American ECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-81.0,24.0],[-80.0,25.5],[-79.5,27.0],[-79.0,29.0],[-78.0,33.5],[-76.0,37.0],[-74.0,40.5],[-72.0,42.0],[-70.0,43.5],[-68.0,45.0],[-66.0,46.0],[-64.0,47.0],[-62.0,48.0],[-60.0,49.0],[-58.0,49.5],[-56.0,50.0],[-52.0,49.5],[-48.0,48.0],[-45.0,46.0],[-43.0,44.0],[-42.0,41.0],[-42.5,38.0],[-44.0,35.0],[-46.0,32.0],[-50.0,28.0],[-55.0,25.0],[-60.0,23.5],[-65.0,23.0],[-70.0,23.0],[-75.0,23.5],[-79.0,23.5],[-81.0,24.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_SECA", "zoneName": "US Caribbean SECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-67.5,17.5],[-64.5,17.5],[-64.5,19.0],[-65.5,19.5],[-67.0,19.0],[-67.5,18.0],[-67.5,17.5]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_SECA", "zoneName": "US Pacific Coast ECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-125.0,32.5],[-122.0,32.5],[-119.5,34.0],[-118.5,36.0],[-118.0,38.0],[-119.0,40.0],[-121.0,42.0],[-123.0,44.0],[-125.0,46.0],[-127.0,48.0],[-129.0,49.5],[-132.0,51.0],[-134.0,52.5],[-135.5,54.0],[-137.0,56.0],[-138.0,58.0],[-141.0,59.0],[-144.0,59.0],[-145.0,57.0],[-144.0,55.0],[-142.0,53.0],[-139.0,51.0],[-136.0,49.0],[-133.0,47.0],[-130.0,45.0],[-128.0,43.0],[-127.0,40.0],[-127.0,37.0],[-127.5,34.5],[-126.5,33.0],[-125.0,32.5]]]
            }
          }
        ]
      })
    },
    {
      code: 'ECA_NECA',
      name: 'ECA NECA',
      zoneType: 'ECA_NECA',
      authority: 'IMO',
      status: 'Active',
      isActive: true,
      displayOrder: 2,
      color: '#4ECDC4',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'MultiPolygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "ECA_NECA",
        "features": [
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_NECA", "zoneName": "North American NECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-81.0,24.0],[-80.0,25.5],[-79.5,27.0],[-79.0,29.0],[-78.0,33.5],[-76.0,37.0],[-74.0,40.5],[-72.0,42.0],[-70.0,43.5],[-68.0,45.0],[-66.0,46.0],[-64.0,47.0],[-62.0,48.0],[-60.0,49.0],[-58.0,49.5],[-56.0,50.0],[-52.0,49.5],[-48.0,48.0],[-45.0,46.0],[-43.0,44.0],[-42.0,41.0],[-42.5,38.0],[-44.0,35.0],[-46.0,32.0],[-50.0,28.0],[-55.0,25.0],[-60.0,23.5],[-65.0,23.0],[-70.0,23.0],[-75.0,23.5],[-79.0,23.5],[-81.0,24.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "ECA_NECA", "zoneName": "US Caribbean NECA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-67.5,17.5],[-64.5,17.5],[-64.5,19.0],[-65.5,19.5],[-67.0,19.0],[-67.5,18.0],[-67.5,17.5]]]
            }
          }
        ]
      })
    },
    {
      code: 'PIRACY_HRA',
      name: 'Piracy High Risk Area',
      zoneType: 'PIRACY_HRA',
      authority: 'IMO',
      status: 'Active',
      isActive: true,
      displayOrder: 3,
      color: '#FFD93D',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'Polygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "PIRACY_HRA",
        "features": [
          {
            "type": "Feature",
            "properties": { "zoneCode": "PIRACY_HRA", "zoneName": "Gulf of Aden & Somali Coast HRA" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[
                [39.0,22.0],[43.0,22.5],[46.0,23.0],[49.0,23.5],[52.0,24.0],[55.0,24.0],[58.0,23.5],[60.0,22.5],[62.0,21.0],[64.0,19.0],[66.0,17.0],[68.0,15.0],[70.0,13.0],[72.0,11.0],[74.0,9.0],[76.0,7.0],[78.0,5.0],[78.0,0.0],[78.0,-5.0],[77.0,-8.0],[75.0,-10.0],[72.0,-11.0],[68.0,-11.5],[64.0,-11.5],[60.0,-11.0],[56.0,-10.0],[52.0,-8.5],[48.0,-6.5],[45.0,-4.0],[43.0,-1.0],[42.0,2.0],[41.5,5.0],[41.0,8.0],[40.5,11.0],[40.0,14.0],[39.5,17.0],[39.0,20.0],[39.0,22.0]
              ]]
            }
          }
        ]
      })
    },
    {
      code: 'MARPOL_SPECIAL_AREA',
      name: 'MARPOL Special Area',
      zoneType: 'MARPOL_SPECIAL_AREA',
      authority: 'IMO',
      status: 'Active',
      isActive: true,
      displayOrder: 4,
      color: '#95E1D3',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'MultiPolygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "MARPOL_SPECIAL_AREA",
        "features": [
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Mediterranean Sea" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-5.5,36.0],[0.0,37.5],[3.0,39.5],[8.0,41.5],[12.0,42.5],[15.0,43.0],[18.0,42.5],[21.0,41.0],[24.0,40.0],[27.0,39.5],[30.0,40.5],[33.0,41.5],[36.0,42.0],[36.5,40.5],[36.0,38.0],[35.0,36.0],[34.0,34.5],[32.5,33.5],[30.0,32.5],[27.0,32.0],[24.0,32.5],[21.0,33.0],[18.0,33.5],[15.0,34.5],[12.0,35.5],[9.0,36.0],[6.0,36.0],[3.0,35.5],[0.0,35.5],[-3.0,35.5],[-5.5,36.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Baltic Sea" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[10.5,53.5],[14.0,54.0],[18.0,54.5],[22.0,55.5],[26.0,59.5],[30.0,60.0],[31.0,65.5],[24.0,66.0],[21.0,65.5],[18.0,64.0],[15.0,62.0],[12.0,59.0],[10.0,56.5],[9.5,54.5],[10.5,53.5]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Black Sea" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[27.5,41.0],[28.5,42.0],[30.0,43.0],[32.0,44.0],[34.0,45.0],[36.0,45.5],[38.0,45.5],[40.0,45.0],[41.5,44.0],[41.5,42.0],[40.5,41.0],[39.0,41.5],[37.0,42.0],[35.0,42.5],[33.0,42.5],[31.0,42.0],[29.0,41.5],[27.5,41.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Red Sea" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[32.5,22.0],[34.0,23.5],[35.0,25.0],[36.0,27.0],[37.0,28.5],[38.0,29.5],[39.5,29.0],[40.5,27.5],[41.5,25.5],[42.5,23.5],[43.0,21.5],[43.5,19.0],[43.5,16.5],[43.0,14.5],[42.0,13.0],[40.5,12.5],[38.5,12.5],[36.5,13.0],[35.0,14.5],[34.0,16.5],[33.0,18.5],[32.5,20.0],[32.5,22.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Gulfs (Arabian Gulf)" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[48.0,24.0],[50.0,24.5],[52.0,25.5],[54.0,26.5],[56.0,27.0],[57.0,26.5],[56.5,25.5],[56.0,24.5],[55.0,23.5],[54.0,23.0],[52.5,23.0],[51.0,23.5],[49.5,23.5],[48.5,23.5],[48.0,24.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "MARPOL_SPECIAL_AREA", "zoneName": "Antarctic" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[-180.0,-60.0],[180.0,-60.0],[180.0,-90.0],[-180.0,-90.0],[-180.0,-60.0]]]
            }
          }
        ]
      })
    },
    {
      code: 'WAR_RISK',
      name: 'War Risk Zone',
      zoneType: 'WAR_RISK',
      authority: 'Other',
      status: 'Active',
      isActive: true,
      displayOrder: 5,
      color: '#FA7070',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'MultiPolygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "WAR_RISK",
        "features": [
          {
            "type": "Feature",
            "properties": { "zoneCode": "WAR_RISK", "zoneName": "Red Sea & Gulf of Aden War Risk" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[32.5,22.0],[34.0,23.5],[36.0,25.0],[38.0,27.0],[40.0,28.5],[42.0,28.0],[44.0,26.5],[46.0,24.5],[48.0,22.0],[49.0,19.5],[49.5,17.0],[49.0,14.5],[48.0,12.5],[46.0,11.0],[43.5,10.5],[41.0,11.0],[39.0,12.0],[37.5,13.5],[36.0,15.5],[35.0,17.5],[34.0,19.5],[33.0,21.0],[32.5,22.0]]]
            }
          },
          {
            "type": "Feature",
            "properties": { "zoneCode": "WAR_RISK", "zoneName": "Persian Gulf War Risk" },
            "geometry": {
              "type": "Polygon",
              "coordinates": [[[48.0,24.0],[50.0,24.5],[52.0,25.5],[54.0,26.5],[56.0,27.5],[58.0,27.0],[59.0,26.0],[59.5,24.5],[59.0,23.0],[57.5,22.0],[55.5,21.5],[53.0,22.0],[51.0,22.5],[49.0,23.0],[48.0,24.0]]]
            }
          }
        ]
      })
    },
    {
      code: 'COMPANY_TRADING_AREA',
      name: 'Company Trading Area',
      zoneType: 'COMPANY_TRADING_AREA',
      authority: 'Company',
      status: 'Active',
      isActive: false,
      displayOrder: 6,
      color: '#A8DADC',
      fillOpacity: 0.12,
      strokeOpacity: 0.7,
      strokeWeight: 1,
      geometryType: 'MultiPolygon',
      geoJson: JSON.stringify({
        "type": "FeatureCollection",
        "name": "COMPANY_TRADING_AREA",
        "features": []
      })
    }
  ];

  const seedMutation = useMutation({
    mutationFn: async () => {
      const results = [];
      for (const zoneData of maritimeZonesData) {
        try {
          await base44.entities.MaritimeZone.create({
            ...zoneData,
            publicId: crypto.randomUUID(),
            tenantId: 'default-tenant'
          });
          results.push({ zone: zoneData.name, success: true });
        } catch (error) {
          results.push({ zone: zoneData.name, success: false, error: error.message });
        }
      }
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries(['maritimeZones']);
      setResult({ success: true, results });
    },
    onError: (error) => {
      setResult({ success: false, error: error.message });
    }
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Seed Maritime Zones</h1>
        <p className="text-gray-600 mt-1">Populate maritime zones with GeoJSON boundaries</p>
      </div>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">Maritime Zones Data</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            This will create {maritimeZonesData.length} maritime zones with GeoJSON boundaries:
          </p>
          <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
            {maritimeZonesData.map(zone => (
              <li key={zone.code}>{zone.name} ({zone.code})</li>
            ))}
          </ul>

          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-gradient-to-r from-cyan-500 to-blue-600"
          >
            {seedMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Seeding...
              </>
            ) : (
              'Seed Maritime Zones'
            )}
          </Button>

          {result && (
            <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {result.success ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <p className="font-semibold text-green-900">Maritime zones seeded successfully</p>
                  </div>
                  <div className="space-y-1">
                    {result.results.map((r, i) => (
                      <div key={i} className="text-sm flex items-center gap-2">
                        {r.success ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                        <span className={r.success ? 'text-green-700' : 'text-red-700'}>
                          {r.zone} {r.error && `- ${r.error}`}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <p className="font-semibold text-red-900">Failed to seed zones</p>
                  </div>
                  <p className="text-sm text-red-700 mt-1">{result.error}</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}