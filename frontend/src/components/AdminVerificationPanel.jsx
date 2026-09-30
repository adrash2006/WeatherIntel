import React, { useState } from 'react';
import { 
  UserCheck, 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Eye, 
  Check, 
  FileText,
  Search,
  Filter
} from 'lucide-react';

export default function AdminVerificationPanel({ 
  events, 
  onSelectEvent, 
  onUpdateStatus 
}) {
  const [activeQueue, setActiveQueue] = useState('review'); // 'review', 'high_conf', 'verified', 'all'
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedEventForModal, setSelectedEventForModal] = useState(null);
  const [newStatus, setNewStatus] = useState('VERIFIED');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter events based on queue
  const filteredEvents = events.filter(e => {
    const matchesSearch = e.city.toLowerCase().includes(filterQuery.toLowerCase()) || 
                          e.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
                          e.event_id.toLowerCase().includes(filterQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeQueue === 'review') {
      return e.verification_status === 'UNDER HUMAN REVIEW' || e.verification_status === 'LOW CONFIDENCE';
    } else if (activeQueue === 'high_conf') {
      return e.verification_status === 'HIGH CONFIDENCE' || e.verification_status === 'CORROBORATED';
    } else if (activeQueue === 'verified') {
      return e.verification_status === 'VERIFIED';
    }
    return true;
  });

  const handleApplyVerification = async (e) => {
    e.preventDefault();
    if (!selectedEventForModal) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/events/${selectedEventForModal.event_id.replace('#', '')}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          analyst_name: 'Lead Met Officer (Disaster Center)',
          new_status: newStatus,
          notes: notes || 'Official verification completed via Admin Panel.'
        })
      });
      if (res.ok) {
        if (onUpdateStatus) {
          onUpdateStatus(selectedEventForModal.event_id, newStatus);
        }
        setSelectedEventForModal(null);
        setNotes('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#1e3a70] gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#06b6d4]" />
            <h1 className="text-xl font-bold font-heading text-white">
              ADMINISTRATIVE VERIFICATION &amp; DISASTER OVERSIGHT
            </h1>
          </div>
          <p className="text-xs text-[#94a3b8] mt-1">
            Human-in-the-loop validation queue. Authorize severe weather warnings, inspect contradictions, and sign off emergency broadcasts.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="text"
            placeholder="Filter queue by city/ID..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="bg-[#0b152d] border border-[#1e3a70] text-white px-3 py-1.5 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
          />
        </div>
      </div>

      {/* Queue Tabs */}
      <div className="flex flex-wrap gap-2 text-xs">
        <button
          onClick={() => setActiveQueue('review')}
          className={`px-3 py-1.5 rounded border transition-colors flex items-center space-x-1.5 ${
            activeQueue === 'review'
              ? 'bg-[#ef4444] text-white border-[#ef4444] font-bold'
              : 'bg-[#0b152d] text-[#94a3b8] border-[#1e3a70] hover:text-white'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>PENDING REVIEW / CONTRADICTORY</span>
          <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px]">
            {events.filter(e => e.verification_status === 'UNDER HUMAN REVIEW' || e.verification_status === 'LOW CONFIDENCE').length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('high_conf')}
          className={`px-3 py-1.5 rounded border transition-colors flex items-center space-x-1.5 ${
            activeQueue === 'high_conf'
              ? 'bg-[#06b6d4] text-black border-[#06b6d4] font-bold'
              : 'bg-[#0b152d] text-[#94a3b8] border-[#1e3a70] hover:text-white'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>HIGH CONFIDENCE CORROBORATED</span>
          <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px]">
            {events.filter(e => e.verification_status === 'HIGH CONFIDENCE' || e.verification_status === 'CORROBORATED').length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('verified')}
          className={`px-3 py-1.5 rounded border transition-colors flex items-center space-x-1.5 ${
            activeQueue === 'verified'
              ? 'bg-[#10b981] text-black border-[#10b981] font-bold'
              : 'bg-[#0b152d] text-[#94a3b8] border-[#1e3a70] hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>OFFICIALLY VERIFIED</span>
          <span className="bg-black/30 px-1.5 py-0.2 rounded text-[10px]">
            {events.filter(e => e.verification_status === 'VERIFIED').length}
          </span>
        </button>

        <button
          onClick={() => setActiveQueue('all')}
          className={`px-3 py-1.5 rounded border transition-colors ${
            activeQueue === 'all'
              ? 'bg-[#1e3a70] text-white border-[#4cd7f6] font-bold'
              : 'bg-[#0b152d] text-[#94a3b8] border-[#1e3a70] hover:text-white'
          }`}
        >
          ALL EVENTS ({events.length})
        </button>
      </div>

      {/* Events Table / Card Grid */}
      <div className="tactical-card rounded overflow-hidden border border-[#1e3a70]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#070d1e] text-[#94a3b8] border-b border-[#1e3a70] text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-3">Event ID</th>
                <th className="p-3">Title &amp; Location</th>
                <th className="p-3">Category</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Status</th>
                <th className="p-3">Evidence Signals</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e3a70]/50">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-[#64748b]">
                    NO EVENTS IN CURRENT QUEUE.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((evt) => (
                  <tr key={evt.event_id} className="hover:bg-[#112147]/40 transition-colors">
                    <td className="p-3 text-[#4cd7f6] font-bold">
                      {evt.event_id}
                    </td>
                    <td className="p-3">
                      <div className="text-white font-semibold">{evt.title}</div>
                      <div className="text-[#94a3b8] text-[10px]">{evt.city}, {evt.state}</div>
                    </td>
                    <td className="p-3">
                      <span className="text-[#cbd5e1]">{evt.event_type}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-[#10b981]">{evt.confidence}%</span>
                        <div className="w-16 bg-[#112147] h-1.5 rounded overflow-hidden">
                          <div 
                            className="bg-[#10b981] h-full"
                            style={{ width: `${evt.confidence}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        evt.verification_status === 'VERIFIED' ? 'badge-verified' :
                        evt.verification_status === 'HIGH CONFIDENCE' ? 'badge-verified' :
                        evt.verification_status === 'CORROBORATED' ? 'badge-corroborated' :
                        'badge-critical'
                      }`}>
                        {evt.verification_status}
                      </span>
                    </td>
                    <td className="p-3 text-[11px] text-[#94a3b8]">
                      {evt.reports_count} Citizen Reports &bull; {evt.imd_observations?.length || 0} IMD Stations
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => onSelectEvent(evt.event_id)}
                        className="bg-[#112147] hover:bg-[#1e3a70] text-[#06b6d4] px-2.5 py-1 rounded text-[11px] border border-[#1e3a70]"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => {
                          setSelectedEventForModal(evt);
                          setNewStatus('VERIFIED');
                        }}
                        className="bg-[#10b981] hover:bg-[#059669] text-black font-bold px-2.5 py-1 rounded text-[11px]"
                      >
                        Verify
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Verification Modal */}
      {selectedEventForModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#070d1e] border border-[#1e3a70] w-full max-w-lg rounded p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e3a70]">
              <h3 className="text-sm font-bold text-white">
                AUTHORIZE EVENT: {selectedEventForModal.event_id}
              </h3>
              <button 
                onClick={() => setSelectedEventForModal(null)}
                className="text-[#94a3b8] hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[#94a3b8] block mb-1">EVENT SUMMARY:</span>
                <div className="p-2 rounded bg-[#0b152d] text-white">
                  {selectedEventForModal.title} &bull; {selectedEventForModal.city} (Confidence: {selectedEventForModal.confidence}%)
                </div>
              </div>

              <div>
                <label className="text-[#94a3b8] block mb-1">NEW VERIFICATION STATUS:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-[#0b152d] border border-[#1e3a70] text-white p-2 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
                >
                  <option value="VERIFIED">OFFICIALLY VERIFIED</option>
                  <option value="HIGH CONFIDENCE">HIGH CONFIDENCE</option>
                  <option value="CORROBORATED">CORROBORATED</option>
                  <option value="UNDER HUMAN REVIEW">UNDER HUMAN REVIEW</option>
                  <option value="REJECTED">REJECTED / UNCORROBORATED</option>
                </select>
              </div>

              <div>
                <label className="text-[#94a3b8] block mb-1">AUDIT JUSTIFICATION NOTES:</label>
                <textarea
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Enter analyst justification for audit log..."
                  className="w-full bg-[#0b152d] border border-[#1e3a70] text-white p-2 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventForModal(null)}
                  className="px-3 py-1.5 rounded bg-[#112147] text-[#94a3b8] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleApplyVerification}
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded bg-[#10b981] text-black font-bold hover:bg-[#059669]"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Status'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
