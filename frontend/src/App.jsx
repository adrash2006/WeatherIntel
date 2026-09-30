import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import CommandMap from './components/CommandMap';
import EventDossier from './components/EventDossier';
import CitizenReportModal from './components/CitizenReportModal';
import AdminVerificationPanel from './components/AdminVerificationPanel';
import AnalyticsSimulation from './components/AnalyticsSimulation';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'dossier', 'report', 'admin', 'simulate'
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState(true);

  // Data states
  const [events, setEvents] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [imdStations, setImdStations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all events and metrics
  const fetchData = async () => {
    try {
      let url = '/api/events?';
      if (filterType) url += `event_type=${encodeURIComponent(filterType)}&`;
      if (filterSeverity) url += `severity=${encodeURIComponent(filterSeverity)}&`;
      if (filterStatus) url += `verification_status=${encodeURIComponent(filterStatus)}&`;
      if (searchQuery) url += `city=${encodeURIComponent(searchQuery)}&`;

      const [resEvents, resMetrics, resStations] = await Promise.all([
        fetch(url),
        fetch('/api/metrics'),
        fetch('/api/imd/stations')
      ]);

      if (resEvents.ok) {
        const evts = await resEvents.json();
        setEvents(evts);
        // Default selected event if none chosen
        if (!selectedEventId && evts.length > 0) {
          setSelectedEventId(evts[0].event_id);
        }
      }
      if (resMetrics.ok) {
        const m = await resMetrics.json();
        setMetrics(m);
      }
      if (resStations.ok) {
        const s = await resStations.json();
        setImdStations(s);
      }
    } catch (err) {
      console.error('Data fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 5 seconds for live telemetry updates
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [filterType, filterSeverity, filterStatus, searchQuery]);

  // Selected event object
  const selectedEvent = events.find(e => e.event_id === selectedEventId) || events[0] || null;

  const handleSelectEvent = (id) => {
    setSelectedEventId(id);
    setActiveTab('dossier');
  };

  const handleUpdateStatus = (id, newStatus) => {
    setEvents(prev => prev.map(e => {
      if (e.event_id === id) {
        return { ...e, verification_status: newStatus };
      }
      return e;
    }));
  };

  const handleReportSubmitted = (newReportData) => {
    fetchData();
    if (newReportData?.event_id) {
      setSelectedEventId(newReportData.event_id);
    }
  };

  return (
    <div className="min-h-screen bg-[#051424] text-[#d4e4fa] flex flex-col font-mono selection:bg-[#06b6d4] selection:text-black">
      {/* Platform Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'report') {
            setIsReportModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        simulationMode={simulationMode}
        setSimulationMode={setSimulationMode}
        metrics={metrics}
        activeEventsCount={events.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'dashboard' && (
          <CommandMap
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={handleSelectEvent}
            filterType={filterType}
            setFilterType={setFilterType}
            filterSeverity={filterSeverity}
            setFilterSeverity={setFilterSeverity}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}

        {activeTab === 'dossier' && (
          <EventDossier
            event={selectedEvent}
            onBackToMap={() => setActiveTab('dashboard')}
            onVerifyStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'admin' && (
          <AdminVerificationPanel
            events={events}
            onSelectEvent={handleSelectEvent}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {activeTab === 'simulate' && (
          <AnalyticsSimulation
            metrics={metrics}
            onRefreshData={fetchData}
            onSwitchToDossier={handleSelectEvent}
          />
        )}
      </main>

      {/* Citizen Report Modal */}
      <CitizenReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onReportSubmitted={handleReportSubmitted}
      />

      {/* Bottom Global Telemetry Ticker */}
      <footer className="border-t border-[#1e3a70] bg-[#070d1e] py-1.5 px-4 text-[10px] text-[#94a3b8] flex flex-wrap items-center justify-between font-mono">
        <div className="flex items-center space-x-3">
          <span className="text-[#4cd7f6] font-bold">SOURCE INGESTION:</span>
          <span>IMD AWS ARG (Live API / Synced)</span>
          <span>&bull;</span>
          <span>Citizen Observation Mesh (Active)</span>
          <span>&bull;</span>
          <span>Doppler Band-C Radar Inset</span>
        </div>
        <div className="flex items-center space-x-2">
          <span>Digital Personal Data Protection Act (DPDP) 2023 Compliant</span>
          <span>&bull;</span>
          <span className="text-[#10b981]">Encrypted Multi-Source Pipeline</span>
        </div>
      </footer>
    </div>
  );
}
