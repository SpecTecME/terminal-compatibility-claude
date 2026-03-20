import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { 
  X, 
  Ship, 
  ChevronRight, 
  MapPin, 
  Anchor,
  Building2,
  Globe,
  Waves,
  ExternalLink,
  Newspaper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function TerminalPanel({ terminal, onClose }) {
  const [berths, setBerths] = useState([]);
  const [compatibilities, setCompatibilities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (terminal) {
      loadData();
    }
  }, [terminal]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [berthsData, compData] = await Promise.all([
        base44.entities.Berth.filter({ terminal_id: terminal.id }),
        base44.entities.VesselCompatibility.filter({ terminal_id: terminal.id })
      ]);
      setBerths(berthsData);
      setCompatibilities(compData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const approvedCount = compatibilities.filter(c => c.status === 'Approved').length;
  
  // Convert decimal degrees to DMS format
  const toDMS = (decimal, isLat) => {
    const absolute = Math.abs(decimal);
    const degrees = Math.floor(absolute);
    const minutesFloat = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesFloat);
    const seconds = Math.floor((minutesFloat - minutes) * 60);
    const direction = decimal >= 0 ? (isLat ? 'N' : 'E') : (isLat ? 'S' : 'W');
    return `${degrees.toString().padStart(isLat ? 2 : 3, '0')}° ${minutes.toString().padStart(2, '0')}' ${seconds.toString().padStart(2, '0')}"${direction}`;
  };

  return (
    <AnimatePresence>
      {terminal && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="absolute top-0 right-0 w-full md:w-[420px] h-full bg-white border-l border-gray-300 shadow-2xl flex flex-col"
          style={{ zIndex: 1000 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-200 bg-white">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center border border-cyan-500/30 flex-shrink-0">
                  <Building2 className="w-6 h-6 text-cyan-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-900 truncate">{terminal.name}</h2>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {terminal.country || terminal.legacyCountryName || '-'}
                {terminal.port ? ` • ${terminal.port}` : ''}
              </span>
            </div>

            <div className="flex items-center justify-between">
              {terminal.status && (
                <Badge className={`${
                  terminal.status === 'Operational' 
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30' 
                    : 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                } border`}>
                  {terminal.status}
                </Badge>
              )}
              {terminal.website && (
                <a 
                  href={terminal.website.startsWith('http') ? terminal.website : `https://${terminal.website}`}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-gray-900 hover:text-cyan-600 transition-colors"
                >
                  {terminal.website.replace(/^https?:\/\//, '').replace(/^www\./, '')}
                </a>
              )}
            </div>
          </div>

          {/* Scrollable Content */}
          <ScrollArea className="flex-1">
            <div className="p-5 space-y-4">
              {/* Key Statistics */}
              <div className="grid grid-cols-2 gap-3">
                <Link to={createPageUrl(`Berths?terminal=${terminal.id}`)}>
                  <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-cyan-500/50 hover:bg-gray-100 transition-all cursor-pointer">
                    <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                      <Anchor className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Berths</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{berths.length}</p>
                  </div>
                </Link>
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <div className="flex items-center gap-1.5 text-gray-600 mb-1">
                    <Ship className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Approved</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{approvedCount}</p>
                </div>
              </div>

              {/* Terminal Information */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900">Terminal Information</h3>
                
                {terminal.operator && (
                  <div className="flex items-start gap-2 text-sm">
                    <Building2 className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Operator</p>
                      <p className="text-gray-900 font-medium">{terminal.operator}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-600">Coordinates</p>
                      <p className="text-gray-900 font-mono text-xs">
                        Lat: {toDMS(terminal.latitude, true)}<br/>
                        Lon: {toDMS(terminal.longitude, false)}
                      </p>
                    </div>
                    {terminal.timezone && (
                      <div>
                        <p className="text-xs text-gray-600">Time zone</p>
                        <p className="text-gray-900 font-medium">{terminal.timezone}</p>
                      </div>
                    )}
                  </div>
                </div>

                {terminal.terminal_type && (
                  <div className="flex items-start gap-2 text-sm">
                    <Waves className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Terminal Type</p>
                      <p className="text-gray-900 font-medium">{terminal.terminal_type}</p>
                    </div>
                  </div>
                )}

                {(terminal.capacity_mtpa || terminal.storage_capacity) && (
                  <div className="flex items-start gap-2 text-sm">
                    <Anchor className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600">Capacity</p>
                      {terminal.capacity_mtpa && (
                        <p className="text-gray-900 font-medium">{terminal.capacity_mtpa} MTPA</p>
                      )}
                      {terminal.storage_capacity && (
                        <p className="text-gray-700 text-xs">Storage: {terminal.storage_capacity.toLocaleString()} m³</p>
                      )}
                    </div>
                  </div>
                )}

                {terminal.notes && (
                  <div className="pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Notes</p>
                    <p className="text-sm text-gray-700 leading-relaxed">{terminal.notes}</p>
                  </div>
                )}
              </div>

              {/* News Link */}
              <div className="pt-2">
                <a 
                  href={`https://www.google.com/search?q=${encodeURIComponent(terminal.name + ' LNG terminal news')}&tbm=nws`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium group"
                >
                  <Newspaper className="w-4 h-4" />
                  Recent News & Updates
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <Link to={createPageUrl(`TerminalDetail?id=${terminal.id}`)}>
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-sm">
                View Full Details
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}