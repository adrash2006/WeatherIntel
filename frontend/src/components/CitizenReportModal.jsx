import React, { useState } from 'react';
import { 
  X, 
  Camera, 
  MapPin, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle,
  Upload,
  Globe
} from 'lucide-react';

const TRANSLATIONS = {
  en: {
    title: "CITIZEN WEATHER REPORT",
    subtitle: "Submit real-time ground truth observation for meteorological verification",
    eventType: "WEATHER EVENT TYPE",
    description: "DESCRIPTION / GROUND OBSERVATION",
    descPlaceholder: "Describe what you are witnessing (e.g., 'Waterlogging knee-deep near market, trees uprooted, roads completely blocked')",
    location: "LOCATION & LANDMARK",
    city: "City",
    state: "State",
    landmark: "Specific Landmark / Road / Sector",
    gpsBtn: "DETECT GPS COORDINATES",
    uploadPhoto: "UPLOAD GROUND PHOTO EVIDENCE",
    privacyHeading: "DPDP PRIVACY & CONSENT",
    privacyConsent: "I consent to submit this ground observation for public disaster response and meteorological correlation under DPDP guidelines. Personal information is minimized.",
    anonymous: "Submit anonymously (do not record user identity)",
    submitBtn: "SUBMIT TO VERIFICATION ENGINE",
    aiPreview: "AI REAL-TIME UNDERSTANDING PREVIEW"
  },
  hi: {
    title: "नागरिक मौसम रिपोर्ट",
    subtitle: "मौसम संबंधी सत्यापन के लिए वास्तविक समय का जमीनी अवलोकन दर्ज करें",
    eventType: "मौसम घटना का प्रकार",
    description: "विवरण / जमीनी अवलोकन",
    descPlaceholder: "बताएं कि आप क्या देख रहे हैं (उदा. 'सड़क पर घुटनों तक पानी भर गया है, पेड़ गिर गए हैं, रास्ता पूरी तरह बंद है')",
    location: "स्थान और लैंडमार्क",
    city: "शहर",
    state: "राज्य",
    landmark: "विशिष्ट लैंडमार्क / सड़क / क्षेत्र",
    gpsBtn: "जीपीएस (GPS) स्थान का पता लगाएं",
    uploadPhoto: "जमीनी फोटो साक्ष्य अपलोड करें",
    privacyHeading: "डीपीडीपी (DPDP) गोपनीयता एवं सहमति",
    privacyConsent: "मैं सार्वजनिक आपदा प्रतिक्रिया और मौसम संबंधी पुष्टि के लिए यह अवलोकन जमा करने की सहमति देता हूँ।",
    anonymous: "गुमनाम रूप से सबमिट करें (पहचान दर्ज न करें)",
    submitBtn: "सत्यापन इंजन को सबमिट करें",
    aiPreview: "एआई रीयल-टाइम समझ पूर्वावलोकन"
  },
  mr: {
    title: "नागरिक हवामान अहवाल",
    subtitle: "हवामान पडताळणीसाठी थेट जमिनीवरील वास्तव स्थिती नोंदवा",
    eventType: "हवामान घटनेचा प्रकार",
    description: "तपशील / जमिनीवरील निरीक्षण",
    descPlaceholder: "तुम्ही काय पाहत आहात ते सांगा (उदा. 'रस्त्यावर गुडघ्यापर्यंत पाणी साचले आहे, झाडे पडली आहेत, रस्ता पूर्ण बंद आहे')",
    location: "स्थान आणि लँडमार्क",
    city: "शहर",
    state: "राज्य",
    landmark: "विशिष्ट लँडमार्क / रस्ता / चौक",
    gpsBtn: "जीपीएस (GPS) स्थान शोधा",
    uploadPhoto: "थेट फोटो पुरावा अपलोड करा",
    privacyHeading: "डीपीडीपी गोपनीयता आणि संमती",
    privacyConsent: "मी सार्वजनिक सुरक्षिततेसाठी आणि हवामान पडताळणीसाठी ही माहिती सादर करण्यास संमती देतो.",
    anonymous: "निनावीपणे सबमिट करा (नाव नोंदवू नका)",
    submitBtn: "पडताळणी इंजिनला सादर करा",
    aiPreview: "एआय थेट विश्लेषण पूर्वावलोकन"
  }
};

export default function CitizenReportModal({ isOpen, onClose, onReportSubmitted }) {
  const [lang, setLang] = useState('en');
  const t = TRANSLATIONS[lang];

  const [eventType, setEventType] = useState('Heavy Rain');
  const [description, setDescription] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consentGiven, setConsentGiven] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);

  if (!isOpen) return null;

  // Handle GPS detection
  const handleDetectGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude.toFixed(4));
          setLongitude(pos.coords.longitude.toFixed(4));
          // If in Pune/Mumbai coords, auto set city
          if (pos.coords.latitude > 18.0 && pos.coords.latitude < 19.0) {
            setCity('Pune');
            setState('Maharashtra');
          } else if (pos.coords.latitude >= 19.0 && pos.coords.latitude < 20.0) {
            setCity('Mumbai');
            setState('Maharashtra');
          }
        },
        (err) => {
          // Fallback simulation coordinates for Pune
          setLatitude('18.5204');
          setLongitude('73.8567');
          setCity('Pune');
          setState('Maharashtra');
        }
      );
    } else {
      setLatitude('18.5204');
      setLongitude('73.8567');
      setCity('Pune');
      setState('Maharashtra');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // Heuristic AI Preview as user types
  const getSimulatedAiAnalysis = (text) => {
    if (!text || text.length < 5) return null;
    const lower = text.lower ? text.lower() : text.toLowerCase();
    let detectedType = eventType;
    let detectedSeverity = "MODERATE";

    if (lower.includes("paani") || lower.includes("flood") || lower.includes("submerge") || lower.includes("pani") || lower.includes("पाणी") || lower.includes("पूर")) {
      detectedType = "Flood";
      detectedSeverity = "HIGH";
    } else if (lower.includes("rain") || lower.includes("paus") || lower.includes("barish") || lower.includes("पाऊस") || lower.includes("बारिश")) {
      detectedType = "Heavy Rain";
    } else if (lower.includes("thunder") || lower.includes("toofan") || lower.includes("lightning") || lower.includes("वादळ")) {
      detectedType = "Thunderstorm";
      detectedSeverity = "HIGH";
    }

    if (lower.includes("completely blocked") || lower.includes("subway") || lower.includes("life threatening") || lower.includes("डूब")) {
      detectedSeverity = "CRITICAL";
    }

    return {
      type: detectedType,
      severity: detectedSeverity,
      confidence: 0.88,
      detectedLang: lang
    };
  };

  const aiPreview = getSimulatedAiAnalysis(description);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description) return;
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('event_type', eventType);
      formData.append('city', city || 'Pune');
      formData.append('state', state || 'Maharashtra');
      if (latitude) formData.append('latitude', latitude);
      if (longitude) formData.append('longitude', longitude);
      if (landmark) formData.append('landmark', landmark);
      formData.append('is_anonymous', isAnonymous);
      formData.append('consent_given', consentGiven);
      if (selectedFile) {
        formData.append('photo', selectedFile);
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitResult({
          success: true,
          reportId: data.report_id,
          eventId: data.event_id,
          confidence: data.confidence,
          isDuplicate: data.is_duplicate,
          message: data.message
        });
        if (onReportSubmitted) {
          onReportSubmitted(data);
        }
      } else {
        setSubmitResult({
          success: false,
          message: data.detail || 'Failed to submit report.'
        });
      }
    } catch (err) {
      setSubmitResult({
        success: false,
        message: err.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-[#070d1e] border border-[#1e3a70] w-full max-w-2xl rounded shadow-2xl overflow-hidden font-mono text-xs my-auto">
        {/* Modal Header */}
        <div className="bg-[#0b152d] border-b border-[#1e3a70] p-4 flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldCheck className="w-5 h-5 text-[#10b981]" />
              <h2 className="text-sm font-bold font-heading text-white">
                {t.title}
              </h2>
            </div>
            <p className="text-[11px] text-[#94a3b8] mt-0.5">
              {t.subtitle}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Switcher */}
            <div className="flex items-center space-x-1 bg-[#112147] border border-[#1e3a70] rounded p-0.5">
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2 py-0.5 rounded text-[10px] ${lang === 'en' ? 'bg-[#06b6d4] text-black font-bold' : 'text-[#94a3b8]'}`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLang('hi')}
                className={`px-2 py-0.5 rounded text-[10px] ${lang === 'hi' ? 'bg-[#06b6d4] text-black font-bold' : 'text-[#94a3b8]'}`}
              >
                हिन्दी
              </button>
              <button
                type="button"
                onClick={() => setLang('mr')}
                className={`px-2 py-0.5 rounded text-[10px] ${lang === 'mr' ? 'bg-[#06b6d4] text-black font-bold' : 'text-[#94a3b8]'}`}
              >
                मराठी
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-[#94a3b8] hover:text-white p-1 rounded hover:bg-[#112147]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {submitResult?.success ? (
          <div className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[#10b981]/20 border-2 border-[#10b981] flex items-center justify-center mx-auto text-[#10b981]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white font-heading">
              REPORT INGESTED &amp; FUSED INTO CLUSTER
            </h3>
            <p className="text-xs text-[#94a3b8] max-w-md mx-auto">
              {submitResult.message}
            </p>
            <div className="bg-[#0b152d] border border-[#1e3a70] p-3 rounded max-w-sm mx-auto space-y-1 text-left">
              <div><strong>Report ID:</strong> <span className="text-[#4cd7f6]">{submitResult.reportId}</span></div>
              <div><strong>Event Fused:</strong> <span className="text-[#10b981]">{submitResult.eventId}</span></div>
              <div><strong>Confidence Score:</strong> <span className="text-white">{submitResult.confidence}%</span></div>
              {submitResult.isDuplicate && (
                <div className="text-[#f59e0b]"><strong>Duplicate Status:</strong> Merged into existing cluster node.</div>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-[#06b6d4] text-[#051424] font-bold px-6 py-2 rounded text-xs"
            >
              CLOSE &amp; VIEW ON MAP
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
            {/* Event Category Buttons */}
            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1.5 font-bold">
                {t.eventType}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {['Heavy Rain', 'Flood', 'Thunderstorm', 'Heatwave', 'Fog', 'Strong Wind'].map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setEventType(type)}
                    className={`p-2 rounded text-left border transition-all ${
                      eventType === type
                        ? 'bg-[#112147] border-[#06b6d4] text-white shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'bg-[#0b152d] border-[#1e3a70] text-[#94a3b8] hover:text-white'
                    }`}
                  >
                    <div className="font-bold text-[11px]">{type}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1 font-bold">
                {t.description}
              </label>
              <textarea
                required
                rows="3"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.descPlaceholder}
                className="w-full bg-[#0b152d] border border-[#1e3a70] text-white p-2.5 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
              />
            </div>

            {/* Real-Time AI Understanding Card */}
            {aiPreview && (
              <div className="bg-[#112147]/60 border border-[#06b6d4]/50 p-2.5 rounded text-[11px]">
                <div className="flex items-center space-x-1.5 text-[#4cd7f6] font-bold mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t.aiPreview}</span>
                </div>
                <div className="flex flex-wrap gap-3 text-[#cbd5e1]">
                  <span>Classified Category: <strong className="text-white">{aiPreview.type}</strong></span>
                  <span>Estimated Severity: <strong className="text-[#f59e0b]">{aiPreview.severity}</strong></span>
                  <span>Extracted Language: <strong className="text-[#10b981]">{aiPreview.detectedLang.toUpperCase()}</strong></span>
                </div>
              </div>
            )}

            {/* Location Fields */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#94a3b8] text-[10px] font-bold">
                  {t.location}
                </label>
                <button
                  type="button"
                  onClick={handleDetectGPS}
                  className="text-[#06b6d4] hover:text-[#4cd7f6] flex items-center text-[10px]"
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  {t.gpsBtn}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  placeholder={t.city}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-[#0b152d] border border-[#1e3a70] text-white p-2 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
                />
                <input
                  type="text"
                  placeholder={t.state}
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-[#0b152d] border border-[#1e3a70] text-white p-2 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
                />
                <input
                  type="text"
                  placeholder={t.landmark}
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="bg-[#0b152d] border border-[#1e3a70] text-white p-2 rounded text-xs focus:outline-none focus:border-[#06b6d4]"
                />
              </div>

              {(latitude || longitude) && (
                <div className="mt-1 text-[10px] text-[#10b981]">
                  GPS Locked: {latitude}&deg;N, {longitude}&deg;E
                </div>
              )}
            </div>

            {/* Photo Upload & Perceptual Hashing */}
            <div>
              <label className="block text-[#94a3b8] text-[10px] mb-1 font-bold">
                {t.uploadPhoto}
              </label>
              <div className="border border-dashed border-[#1e3a70] p-3 rounded bg-[#0b152d] text-center cursor-pointer hover:border-[#06b6d4] relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="opacity-0 absolute inset-0 cursor-pointer w-full h-full"
                />
                {previewUrl ? (
                  <div className="flex items-center justify-center space-x-3">
                    <img src={previewUrl} alt="Preview" className="w-12 h-12 object-cover rounded border border-[#1e3a70]" />
                    <span className="text-white text-xs">{selectedFile?.name} (Ready for dHash analysis)</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-2 text-[#94a3b8]">
                    <Upload className="w-5 h-5 mb-1 text-[#06b6d4]" />
                    <span>Drop image here or click to browse</span>
                  </div>
                )}
              </div>
            </div>

            {/* DPDP Consent & Privacy Box */}
            <div className="bg-[#0b152d] border border-[#1e3a70] p-3 rounded space-y-2">
              <div className="text-[10px] font-bold text-[#4cd7f6]">
                {t.privacyHeading}
              </div>
              <label className="flex items-start space-x-2 text-[11px] text-[#94a3b8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  className="mt-0.5 text-[#06b6d4] focus:ring-0 rounded bg-[#112147] border-[#1e3a70]"
                />
                <span>{t.privacyConsent}</span>
              </label>
              <label className="flex items-center space-x-2 text-[11px] text-[#94a3b8] cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="text-[#06b6d4] focus:ring-0 rounded bg-[#112147] border-[#1e3a70]"
                />
                <span>{t.anonymous}</span>
              </label>
            </div>

            {submitResult && !submitResult.success && (
              <div className="p-2.5 rounded bg-[#ef4444]/20 border border-[#ef4444] text-[#ef4444] text-xs">
                {submitResult.message}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !consentGiven}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-2.5 rounded text-xs transition-all shadow-[0_0_12px_rgba(16,185,129,0.4)] disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSubmitting ? 'PROCESSING THROUGH AI PIPELINE...' : t.submitBtn}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
