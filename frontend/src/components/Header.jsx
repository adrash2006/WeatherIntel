import React from 'react';
import { 
  Radio, 
  ShieldAlert, 
  Activity, 
  MapPin, 
  Layers, 
  FileText, 
  UserCheck, 
  PlayCircle,
  Database,
  Cpu
} from 'lucide-react';

export default function Header({ 
  activeTab, 
  setActiveTab, 
  simulationMode, 
  setSimulationMode,
  metrics,
  activeEventsCount 
}) {
  return (
    <header className="border-b border-[#1e3a70] bg-[#070d1e] sticky top-0 z-50">
      {/* Top Banner Ticker */}
      <div className="bg-[#0b152d] border-b border-[#1e3a70]/50 px-4 py-1.5 flex flex-wrap items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-3">
          <span className="flex items-center text-[#4cd7f6] font-semibold tracking-wider">
            <span className="w-2 h-2 rounded-full bg-[#10b981] animate-ping mr-2 inline-block"></span>
            NATIONAL SITUATIONAL RADAR // UTC+05:30 (IST)
          </span>
          <span className="text-[#64748b]">|</span>
          <span className="text-[#94a3b8] flex items-center">
            <Activity className="w-3.5 h-3.5 text-[#06b6d4] mr-1" />
            PIPELINE LATENCY: <strong className="text-white ml-1">{metrics?.avg_processing_latency_sec || '1.2'}s</strong>
          </span>
          <span className="text-[#64748b]">|</span>
          <span className="text-[#94a3b8]">
            CORROBORATION ACCURACY: <strong className="text-[#10b981] ml-1">{metrics?.avg_confidence || '84.2'}%</strong>
          </span>
        </div>

        <div className="flex items-center space-x-4">
          {simulationMode && (
            <span className="bg-[#f59e0b]/20 border border-[#f59e0b] text-[#f59e0b] px-2 py-0.5 rounded text-[10px] font-bold tracking-widest animate-pulse flex items-center">
              <Cpu className="w-3 h-3 mr-1" />
              SIMULATION ENGINE ACTIVE
            </span>
          )}
          <button 
            onClick={() => setSimulationMode(!simulationMode)}
            className={`px-2.5 py-0.5 rounded border text-xs transition-colors flex items-center space-x-1.5 ${
              simulationMode 
                ? 'bg-[#f59e0b] text-black border-[#f59e0b] font-bold' 
                : 'bg-[#112147] text-[#94a3b8] border-[#1e3a70] hover:text-white'
            }`}
          >
            <span>{simulationMode ? 'EXIT SIMULATION' : 'DEMO / SIMULATION MODE'}</span>
          </button>
        </div>
      </div>

      {/* Main Title & Nav Area */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded bg-gradient-to-br from-[#06b6d4] to-[#1e3a70] flex items-center justify-center border border-[#4cd7f6]/40 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
            <Radio className="w-6 h-6 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base sm:text-lg font-bold font-heading tracking-wide text-white uppercase">
                National Weather Event Intelligence & Verification Platform
              </h1>
              <span className="hidden sm:inline-block bg-[#1e3a70] text-[#4cd7f6] text-[10px] px-1.5 py-0.5 rounded font-mono font-bold">
                SIH26069
              </span>
            </div>
            <p className="text-xs text-[#94a3b8]">
              Authoritative IMD AWS Telemetry &times; Citizen Ground Reports &times; Geospatial Verification Mesh
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-all ${
              activeTab === 'dashboard'
                ? 'bg-[#06b6d4] text-[#051424] font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#0b152d] text-[#d4e4fa] hover:bg-[#112147] border border-[#1e3a70]'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>COMMAND MAP</span>
            <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px] font-bold ml-1">
              {activeEventsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dossier')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-all ${
              activeTab === 'dossier'
                ? 'bg-[#06b6d4] text-[#051424] font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#0b152d] text-[#d4e4fa] hover:bg-[#112147] border border-[#1e3a70]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>EVIDENCE DOSSIER</span>
          </button>

          <button
            onClick={() => setActiveTab('report')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-all ${
              activeTab === 'report'
                ? 'bg-[#10b981] text-black font-bold shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                : 'bg-[#0b152d] text-[#10b981] hover:bg-[#112147] border border-[#10b981]/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>CITIZEN REPORT</span>
          </button>

          <button
            onClick={() => setActiveTab('admin')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-all ${
              activeTab === 'admin'
                ? 'bg-[#06b6d4] text-[#051424] font-bold shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-[#0b152d] text-[#d4e4fa] hover:bg-[#112147] border border-[#1e3a70]'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>ADMIN VERIFICATION</span>
            {metrics?.human_review_required > 0 && (
              <span className="bg-[#ef4444] text-white px-1.5 py-0.2 rounded-full text-[10px] font-bold">
                {metrics.human_review_required}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('simulate')}
            className={`px-3 py-2 rounded flex items-center space-x-1.5 transition-all ${
              activeTab === 'simulate'
                ? 'bg-[#f59e0b] text-black font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-[#0b152d] text-[#f59e0b] hover:bg-[#112147] border border-[#f59e0b]/40'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>SCENARIOS & ANALYTICS</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
