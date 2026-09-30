import React, { useState } from 'react';
import { 
  Play, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle, 
  BarChart2, 
  Activity, 
  Cpu, 
  Layers, 
  Send,
  Zap,
  Waves,
  CloudRain
} from 'lucide-react';

export default function AnalyticsSimulation({ 
  metrics, 
  onRefreshData,
  onSwitchToDossier
}) {
  const [scenarioLoading, setScenarioLoading] = useState(false);
  const [scenarioResult, setScenarioResult] = useState(null);

  // Custom Simulator Form State
  const [simCity, setSimCity] = useState('Nagpur');
  const [simState, setSimState] = useState('Maharashtra');
  const [simLat, setSimLat] = useState('21.1458');
  const [simLon, setSimLon] = useState('79.0882');
  const [simType, setSimType] = useState('Thunderstorm');
  const [simSeverity, setSimSeverity] = useState('HIGH');
  const [simDesc, setSimDesc] = useState('Severe lightning strikes and squalls observed near Sitabuldi market.');
  const [isSimulatingCustom, setIsSimulatingCustom] = useState(false);
  const [customResult, setCustomResult] = useState(null);

  const handleRunScenario = async (scenarioKey) => {
    setScenarioLoading(true);
    setScenarioResult(null);
    try {
      const res = await fetch(`/api/simulate-scenario/${scenarioKey}`, {
        method: 'POST'
      });
      const data = await res.json();
      setScenarioResult(data);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setScenarioResult({ error: err.message });
    } finally {
      setScenarioLoading(false);
    }
  };

  const handleSimulateCustom = async (e) => {
    e.preventDefault();
    setIsSimulatingCustom(true);
    setCustomResult(null);

    try {
      const res = await fetch('/api/simulate-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city: simCity,
          state: simState,
          latitude: parseFloat(simLat),
          longitude: parseFloat(simLon),
          event_type: simType,
          severity: simSeverity,
          description: simDesc
        })
      });
      const data = await res.json();
      setCustomResult(data);
      if (onRefreshData) onRefreshData();
    } catch (err) {
      setCustomResult({ error: err.message });
    } finally {
      setIsSimulatingCustom(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 font-mono">
      {/* Header */}
      <div className="border-b border-[#1e3a70] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-[#f59e0b]" />
            <h1 className="text-xl font-bold font-heading text-white">
              SIMULATION ENGINE &amp; OPERATIONAL ANALYTICS
            </h1>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Deterministic simulation testbed. Inject synthetic events, reproduce edge-cases, and evaluate confidence engine responses.
          </p>
        </div>

        <div className="bg-[#112147] border border-[#f59e0b]/50 px-3 py-1.5 rounded flex items-center space-x-2 text-xs text-[#f59e0b]">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b] animate-ping" />
          <span>ALL SIMULATED DATA TRAVELS FULL PIPELINE</span>
        </div>
      </div>

      {/* Operational Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="tactical-card p-3 rounded">
          <div className="text-[10px] text-[#94a3b8] uppercase">REPORTS PROCESSED</div>
          <div className="text-2xl font-bold text-white mt-1">
            {metrics?.reports_processed || 8}
          </div>
          <div className="text-[10px] text-[#4cd7f6] mt-1">100% Ingested</div>
        </div>

        <div className="tactical-card p-3 rounded">
          <div className="text-[10px] text-[#94a3b8] uppercase">EVENTS DETECTED</div>
          <div className="text-2xl font-bold text-[#10b981] mt-1">
            {metrics?.events_detected || 4}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-1">Spatio-Temporal Clusters</div>
        </div>

        <div className="tactical-card p-3 rounded">
          <div className="text-[10px] text-[#94a3b8] uppercase">DUPLICATES MERGED</div>
          <div className="text-2xl font-bold text-[#f59e0b] mt-1">
            {metrics?.duplicate_reports || 1}
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-1">Perceptual dHash Match</div>
        </div>

        <div className="tactical-card p-3 rounded">
          <div className="text-[10px] text-[#94a3b8] uppercase">AVG PROCESSING SPEED</div>
          <div className="text-2xl font-bold text-[#38bdf8] mt-1">
            {metrics?.avg_processing_latency_sec || 1.2}s
          </div>
          <div className="text-[10px] text-[#10b981] mt-1">Near Real-Time</div>
        </div>
      </div>

      {/* 3 Core Preconfigured Demo Scenarios (Prompt Section 31) */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Play className="w-4 h-4 text-[#06b6d4]" />
          <h2 className="text-sm font-bold font-heading text-white tracking-wide">
            PRECONFIGURED HACKATHON DEMO SCENARIOS
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Scenario A: Pune Heavy Rain */}
          <div className="tactical-card p-4 rounded flex flex-col justify-between border-l-4 border-l-[#4cd7f6]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#4cd7f6] font-bold text-[11px]">SCENARIO A</span>
                <CloudRain className="w-4 h-4 text-[#4cd7f6]" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                Heavy Rain Escalation (Pune)
              </h3>
              <p className="text-[#94a3b8] text-[11px] mb-3 leading-relaxed">
                Demonstrates dynamic confidence progression. Initial unverified citizen report (54%) escalates to 87% as multiple nearby citizen reports and IMD Shivajinagar AWS telemetry (78 mm/hr) corroborate.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario('pune_rain')}
              disabled={scenarioLoading}
              className="w-full bg-[#112147] hover:bg-[#1e3a70] text-[#4cd7f6] border border-[#1e3a70] py-2 rounded text-xs font-bold transition-all"
            >
              {scenarioLoading ? 'RUNNING PIPELINE...' : 'EXECUTE SCENARIO A &rarr;'}
            </button>
          </div>

          {/* Scenario B: Mumbai Urban Flooding */}
          <div className="tactical-card p-4 rounded flex flex-col justify-between border-l-4 border-l-[#10b981]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#10b981] font-bold text-[11px]">SCENARIO B</span>
                <Waves className="w-4 h-4 text-[#10b981]" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                Urban Flood &amp; Deduplication (Mumbai)
              </h3>
              <p className="text-[#94a3b8] text-[11px] mb-3 leading-relaxed">
                Demonstrates intelligent deduplication. Identifies viral repost of Andheri Subway flood photo using 64-bit perceptual hashing (dHash) and clusters duplicate into 1 event without losing evidence.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario('mumbai_flood')}
              disabled={scenarioLoading}
              className="w-full bg-[#112147] hover:bg-[#1e3a70] text-[#10b981] border border-[#1e3a70] py-2 rounded text-xs font-bold transition-all"
            >
              {scenarioLoading ? 'RUNNING PIPELINE...' : 'EXECUTE SCENARIO B &rarr;'}
            </button>
          </div>

          {/* Scenario C: Low Confidence / Contradictory */}
          <div className="tactical-card p-4 rounded flex flex-col justify-between border-l-4 border-l-[#ef4444]">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[#ef4444] font-bold text-[11px]">SCENARIO C</span>
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
              </div>
              <h3 className="font-bold text-white text-sm mb-1">
                Contradictory Signal (Delhi)
              </h3>
              <p className="text-[#94a3b8] text-[11px] mb-3 leading-relaxed">
                Demonstrates explainable misinformation handling. Citizen claims severe cloudburst in Connaught Place, but IMD Safdarjung AWS reports 0.0 mm/hr and 38&deg;C. System applies -15 penalty and flags for Human Review.
              </p>
            </div>
            <button
              onClick={() => handleRunScenario('low_confidence')}
              disabled={scenarioLoading}
              className="w-full bg-[#112147] hover:bg-[#1e3a70] text-[#ef4444] border border-[#1e3a70] py-2 rounded text-xs font-bold transition-all"
            >
              {scenarioLoading ? 'RUNNING PIPELINE...' : 'EXECUTE SCENARIO C &rarr;'}
            </button>
          </div>
        </div>

        {scenarioResult && (
          <div className="p-3 rounded bg-[#0b152d] border border-[#06b6d4] text-xs">
            <div className="font-bold text-[#4cd7f6] mb-1">SCENARIO EXECUTION LOG:</div>
            <p className="text-white mb-2">{scenarioResult.message}</p>
            {scenarioResult.event_id && (
              <div className="flex items-center space-x-3 text-[11px]">
                <span>Event Created: <strong className="text-[#10b981]">{scenarioResult.event_id}</strong></span>
                <span>Final Confidence: <strong className="text-white">{scenarioResult.final_confidence || scenarioResult.confidence}%</strong></span>
                <button
                  onClick={() => onSwitchToDossier && onSwitchToDossier(scenarioResult.event_id)}
                  className="text-[#06b6d4] underline hover:text-[#4cd7f6]"
                >
                  View Event Dossier &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Custom Event Injection Generator (POST /simulate-event) */}
      <div className="tactical-card p-5 rounded space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e3a70] pb-3">
          <div className="flex items-center space-x-2">
            <Send className="w-4 h-4 text-[#06b6d4]" />
            <h2 className="text-sm font-bold font-heading text-white">
              CUSTOM WEATHER EVENT GENERATOR (POST /simulate-event)
            </h2>
          </div>
          <span className="text-[10px] text-[#94a3b8]">Canonical Weather Event Pipeline</span>
        </div>

        <form onSubmit={handleSimulateCustom} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1">EVENT TYPE</label>
              <select
                value={simType}
                onChange={(e) => setSimType(e.target.value)}
                className="w-full bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded focus:outline-none focus:border-[#06b6d4]"
              >
                <option value="Heavy Rain">Heavy Rain</option>
                <option value="Flood">Flood</option>
                <option value="Thunderstorm">Thunderstorm</option>
                <option value="Heatwave">Heatwave</option>
                <option value="Fog">Fog</option>
                <option value="Strong Wind">Strong Wind</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1">SEVERITY LEVEL</label>
              <select
                value={simSeverity}
                onChange={(e) => setSimSeverity(e.target.value)}
                className="w-full bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded focus:outline-none focus:border-[#06b6d4]"
              >
                <option value="LOW">LOW</option>
                <option value="MODERATE">MODERATE</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1">CITY &amp; STATE</label>
              <div className="grid grid-cols-2 gap-1">
                <input
                  type="text"
                  value={simCity}
                  onChange={(e) => setSimCity(e.target.value)}
                  className="bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded"
                  placeholder="City"
                />
                <input
                  type="text"
                  value={simState}
                  onChange={(e) => setSimState(e.target.value)}
                  className="bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded"
                  placeholder="State"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1">LATITUDE &amp; LONGITUDE</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  step="0.0001"
                  value={simLat}
                  onChange={(e) => setSimLat(e.target.value)}
                  className="bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded"
                  placeholder="Latitude"
                />
                <input
                  type="number"
                  step="0.0001"
                  value={simLon}
                  onChange={(e) => setSimLon(e.target.value)}
                  className="bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded"
                  placeholder="Longitude"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1">SYNTHETIC OBSERVATION TEXT</label>
              <input
                type="text"
                value={simDesc}
                onChange={(e) => setSimDesc(e.target.value)}
                className="w-full bg-[#070d1e] border border-[#1e3a70] text-white p-2 rounded"
                placeholder="Observation description..."
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSimulatingCustom}
            className="bg-[#f59e0b] hover:bg-[#d97706] text-black font-bold px-6 py-2 rounded text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.3)] disabled:opacity-50"
          >
            {isSimulatingCustom ? 'INJECTING &amp; PROCESSING...' : 'INJECT SIMULATED EVENT'}
          </button>
        </form>

        {customResult && (
          <div className="p-3 rounded bg-[#070d1e] border border-[#1e3a70] text-xs">
            <span className="text-[#10b981] font-bold">EVENT CREATED: {customResult.event_id}</span>
            <span className="text-[#94a3b8] ml-2">(Confidence: {customResult.confidence}%, Status: {customResult.verification_status})</span>
          </div>
        )}
      </div>
    </div>
  );
}
