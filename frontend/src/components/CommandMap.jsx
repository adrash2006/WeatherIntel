import React, { useEffect, useRef } from 'react';
import { 
  CloudRain, 
  Waves, 
  Zap, 
  Sun, 
  Wind, 
  CloudFog, 
  AlertTriangle, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search,
  Camera,
  Activity,
  ChevronRight,
  Radio
} from 'lucide-react';
import L from 'leaflet';

export default function CommandMap({ 
  events, 
  selectedEventId, 
  onSelectEvent, 
  filterType, 
  setFilterType, 
  filterSeverity, 
  setFilterSeverity, 
  filterStatus, 
  setFilterStatus, 
  searchQuery, 
  setSearchQuery,
  onOpenReportModal 
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center of India (20.5937 N, 78.9629 E)
    const map = L.map(mapContainerRef.current, {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true,
      attributionControl: false
    });

    // Dark cartographic tiles via CartoDB Dark Matter (Free, public, no key required)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Map Markers when events or filters change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    events.forEach(event => {
      // Determine color by severity
      let markerColor = '#06b6d4'; // moderate cyan
      let pulseColor = 'rgba(6, 182, 212, 0.4)';
      if (event.severity === 'CRITICAL') {
        markerColor = '#ef4444';
        pulseColor = 'rgba(239, 68, 68, 0.4)';
      } else if (event.severity === 'HIGH') {
        markerColor = '#f59e0b';
        pulseColor = 'rgba(245, 158, 11, 0.4)';
      }

      // Custom pulsing HTML marker
      const customIcon = L.divIcon({
        className: 'custom-weather-pin',
        html: `
          <div style="position: relative; width: 44px; height: 44px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 40px; height: 40px; border-radius: 50%; background: ${pulseColor}; animation: radar-pulse 2s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: #070d1e; border: 2px solid ${markerColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 10px ${markerColor}; z-index: 2;">
              <span style="font-size: 11px; font-weight: bold; color: ${markerColor}; font-family: monospace;">
                ${event.reports_count}
              </span>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([event.latitude, event.longitude], { icon: customIcon });

      const popupContent = `
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 11px; padding: 4px;">
          <div style="font-weight: bold; color: #4cd7f6; font-size: 12px; margin-bottom: 2px;">
            ${event.event_id}
          </div>
          <div style="color: #ffffff; font-weight: 600; font-size: 13px; margin-bottom: 4px;">
            ${event.title}
          </div>
          <div style="color: #94a3b8; margin-bottom: 6px;">
            ${event.city}, ${event.state}
          </div>
          <div style="display: flex; gap: 8px; margin-bottom: 6px;">
            <span style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; color: #10b981; padding: 1px 6px; border-radius: 3px; font-weight: bold;">
              CONFIDENCE: ${event.confidence}%
            </span>
            <span style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; color: #4cd7f6; padding: 1px 6px; border-radius: 3px;">
              ${event.verification_status}
            </span>
          </div>
          <div style="color: #cbd5e1; font-size: 10px; margin-bottom: 8px;">
            Reports: ${event.reports_count} | Media: ${event.media_count} | Duplicates Merged: ${event.duplicate_count}
          </div>
          <button id="btn-inspect-${event.event_id.replace('#', '')}" style="background: #06b6d4; color: #051424; border: none; padding: 4px 10px; border-radius: 3px; font-weight: bold; cursor: pointer; width: 100%;">
            INSPECT EVIDENCE DOSSIER &rarr;
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('popupopen', () => {
        const btn = document.getElementById(`btn-inspect-${event.event_id.replace('#', '')}`);
        if (btn) {
          btn.onclick = () => onSelectEvent(event.event_id);
        }
      });

      markersLayerRef.current.addLayer(marker);
    });
  }, [events]);

  const getEventIcon = (type) => {
    switch (type) {
      case 'Flood': return <Waves className="w-4 h-4 text-[#38bdf8]" />;
      case 'Heavy Rain': return <CloudRain className="w-4 h-4 text-[#4cd7f6]" />;
      case 'Thunderstorm': return <Zap className="w-4 h-4 text-[#f59e0b]" />;
      case 'Heatwave': return <Sun className="w-4 h-4 text-[#ef4444]" />;
      case 'Strong Wind': return <Wind className="w-4 h-4 text-[#a78bfa]" />;
      case 'Fog': return <CloudFog className="w-4 h-4 text-[#94a3b8]" />;
      default: return <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />;
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)]">
      {/* Filter and Control Bar */}
      <div className="bg-[#0b152d] border-b border-[#1e3a70] p-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-1.5 text-[#94a3b8]">
            <Filter className="w-3.5 h-3.5 text-[#06b6d4]" />
            <span className="font-semibold text-white">FILTERS:</span>
          </div>

          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#112147] border border-[#1e3a70] text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="">ALL EVENT CATEGORIES</option>
            <option value="Heavy Rain">Heavy Rain</option>
            <option value="Flood">Flood</option>
            <option value="Thunderstorm">Thunderstorm</option>
            <option value="Heatwave">Heatwave</option>
            <option value="Fog">Fog</option>
            <option value="Strong Wind">Strong Wind</option>
          </select>

          <select 
            value={filterSeverity} 
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#112147] border border-[#1e3a70] text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="">ALL SEVERITIES</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MODERATE">MODERATE</option>
            <option value="LOW">LOW</option>
          </select>

          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#112147] border border-[#1e3a70] text-white px-2 py-1 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
          >
            <option value="">ALL VERIFICATION STATUSES</option>
            <option value="HIGH CONFIDENCE">HIGH CONFIDENCE (&gt;85%)</option>
            <option value="CORROBORATED">CORROBORATED (65-84%)</option>
            <option value="UNDER HUMAN REVIEW">UNDER HUMAN REVIEW</option>
            <option value="VERIFIED">OFFICIALLY VERIFIED</option>
          </select>

          <div className="relative">
            <Search className="w-3 h-3 text-[#64748b] absolute left-2 top-2" />
            <input 
              type="text" 
              placeholder="Search City / State..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#112147] border border-[#1e3a70] text-white pl-7 pr-2 py-1 rounded text-xs w-36 sm:w-48 focus:outline-none focus:border-[#06b6d4]"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button 
            onClick={onOpenReportModal}
            className="bg-[#10b981] hover:bg-[#059669] text-black font-bold px-3 py-1 rounded text-xs flex items-center space-x-1.5 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>SUBMIT CITIZEN REPORT</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Map on Left, Live Event Triage on Right */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Map Viewport */}
        <div className="flex-1 relative bg-[#051424]">
          <div ref={mapContainerRef} className="w-full h-full" />

          {/* Map HUD Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-[#070d1e]/90 backdrop-blur border border-[#1e3a70] p-3 rounded font-mono text-[11px] shadow-lg max-w-xs pointer-events-auto">
            <div className="text-[#4cd7f6] font-bold mb-1.5 flex items-center justify-between">
              <span>SITUATIONAL CLUSTERS</span>
              <span className="text-[10px] text-[#94a3b8]">DBSCAN 12KM</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-[#ef4444]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] mr-2 inline-block"></span>
                  Critical Severity
                </span>
                <span className="text-[#94a3b8]">Inundation / Threat</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-[#f59e0b]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] mr-2 inline-block"></span>
                  High Severity
                </span>
                <span className="text-[#94a3b8]">Torrential / Gusts</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-[#06b6d4]">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] mr-2 inline-block"></span>
                  Moderate Alert
                </span>
                <span className="text-[#94a3b8]">Convective Cells</span>
              </div>
            </div>
            <div className="border-t border-[#1e3a70] mt-2 pt-1.5 text-[10px] text-[#64748b]">
              Numbers inside pins represent fused citizen &amp; station observations.
            </div>
          </div>
        </div>

        {/* Right Live Events Dispatch Feed */}
        <div className="w-full lg:w-96 bg-[#070d1e] border-l border-[#1e3a70] flex flex-col h-full z-10">
          <div className="p-3 border-b border-[#1e3a70] bg-[#0b152d] flex items-center justify-between font-mono">
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-[#06b6d4] animate-pulse" />
              <span className="font-bold text-white text-xs">LIVE EVENT DISPATCH</span>
            </div>
            <span className="bg-[#112147] text-[#4cd7f6] px-2 py-0.5 rounded text-[10px] border border-[#1e3a70] font-bold">
              {events.length} ACTIVE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {events.length === 0 ? (
              <div className="text-center py-12 text-[#64748b] font-mono text-xs">
                NO EVENTS MATCH CURRENT FILTERS.
              </div>
            ) : (
              events.map((event) => {
                const isSelected = selectedEventId === event.event_id;
                return (
                  <div
                    key={event.event_id}
                    onClick={() => onSelectEvent(event.event_id)}
                    className={`p-3 rounded cursor-pointer transition-all border ${
                      isSelected
                        ? 'tactical-card-active'
                        : 'tactical-card hover:border-[#06b6d4]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center space-x-1.5">
                        {getEventIcon(event.event_type)}
                        <span className="font-mono font-bold text-xs text-white">
                          {event.event_id}
                        </span>
                      </div>
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                        event.severity === 'CRITICAL' ? 'badge-critical' :
                        event.severity === 'HIGH' ? 'badge-warning' : 'badge-corroborated'
                      }`}>
                        {event.severity}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-[#f1f5f9] mb-1 font-heading">
                      {event.title}
                    </div>

                    <div className="text-xs text-[#94a3b8] mb-2 font-mono flex items-center justify-between">
                      <span>{event.city}, {event.state}</span>
                      <span className="text-[#64748b] text-[10px]">
                        {new Date(event.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Confidence Meter Bar */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                        <span className="text-[#94a3b8]">EXPLAINABLE CONFIDENCE:</span>
                        <span className="font-bold text-[#10b981]">{event.confidence}%</span>
                      </div>
                      <div className="w-full bg-[#112147] h-1.5 rounded overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#06b6d4] to-[#10b981] transition-all duration-500"
                          style={{ width: `${event.confidence}%` }}
                        />
                      </div>
                    </div>

                    {/* Multi-Source Evidence Chips */}
                    <div className="flex flex-wrap gap-1 mb-2 font-mono text-[10px]">
                      {event.imd_observations?.length > 0 && (
                        <span className="bg-[#1e3a70]/40 text-[#4cd7f6] px-1.5 py-0.5 rounded border border-[#1e3a70]">
                          IMD: {event.imd_observations[0].rainfall_mm_hr}mm/h
                        </span>
                      )}
                      <span className="bg-[#1e3a70]/40 text-[#d4e4fa] px-1.5 py-0.5 rounded border border-[#1e3a70]">
                        {event.reports_count} Citizen Reports
                      </span>
                      {event.media_count > 0 && (
                        <span className="bg-[#1e3a70]/40 text-[#10b981] px-1.5 py-0.5 rounded border border-[#10b981]/30">
                          {event.media_count} Verified Photos
                        </span>
                      )}
                      {event.duplicate_count > 0 && (
                        <span className="bg-[#1e3a70]/40 text-[#f59e0b] px-1.5 py-0.5 rounded border border-[#f59e0b]/30">
                          {event.duplicate_count} Merged Dups
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-[#1e3a70]/60 text-xs font-mono text-[#06b6d4]">
                      <span>{event.verification_status}</span>
                      <span className="flex items-center text-[11px] hover:text-[#4cd7f6]">
                        Inspect Dossier <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
