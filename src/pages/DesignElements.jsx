import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Waves, Radar, Network, Compass, Gauge, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const iconOptions = [
  {
    name: 'Waves',
    component: Waves,
    description: 'Clean maritime theme, elegant and sophisticated'
  },
  {
    name: 'Radar',
    component: Radar,
    description: 'Suggests monitoring and vessel-terminal compatibility scanning'
  },
  {
    name: 'Network',
    component: Network,
    description: 'Represents interconnected terminals, vessels, and systems'
  },
  {
    name: 'Compass',
    component: Compass,
    description: 'Maritime navigation theme, timeless and strategic'
  },
  {
    name: 'Gauge',
    component: Gauge,
    description: 'Implies measurement and assessment of compatibility'
  }
];

export default function DesignElements() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link to={createPageUrl('ConfigurationAppSettings')}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Design Elements</h1>
          <p className="text-gray-600 mt-1">App logo and icon options for future design discussions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Application Logo Icon Options</CardTitle>
          <CardDescription>Select or discuss icon choices for the main application identity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {iconOptions.map((option) => {
              const Icon = option.component;
              return (
                <div key={option.name} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-3">
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-center text-sm mb-2">{option.name}</h3>
                  <p className="text-xs text-gray-600 text-center leading-relaxed">{option.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}