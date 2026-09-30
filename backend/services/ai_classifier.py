import os
import re
import json
import logging
import requests
from typing import Dict, Any, Tuple
from backend.models.schemas import EventType, Severity

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

# Indian Cities and Synonyms Gazetteer for Regex Location Extraction
INDIAN_CITIES_GAZETTEER = {
    "mumbai": {"state": "Maharashtra", "lat": 19.0760, "lon": 72.8777},
    "andheri": {"city": "Mumbai", "state": "Maharashtra", "lat": 19.1136, "lon": 72.8697},
    "bandra": {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0596, "lon": 72.8295},
    "dadar": {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0178, "lon": 72.8478},
    "kurla": {"city": "Mumbai", "state": "Maharashtra", "lat": 19.0726, "lon": 72.8845},
    "pune": {"state": "Maharashtra", "lat": 18.5204, "lon": 73.8567},
    "shivajinagar": {"city": "Pune", "state": "Maharashtra", "lat": 18.5314, "lon": 73.8446},
    "kothrud": {"city": "Pune", "state": "Maharashtra", "lat": 18.5074, "lon": 73.8077},
    "hadapsar": {"city": "Pune", "state": "Maharashtra", "lat": 18.5089, "lon": 73.9259},
    "delhi": {"state": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "new delhi": {"state": "Delhi", "lat": 28.6139, "lon": 77.2090},
    "noida": {"city": "Noida", "state": "Uttar Pradesh", "lat": 28.5355, "lon": 77.3910},
    "kolkata": {"state": "West Bengal", "lat": 22.5726, "lon": 88.3639},
    "salt lake": {"city": "Kolkata", "state": "West Bengal", "lat": 22.5867, "lon": 88.4170},
    "howrah": {"city": "Kolkata", "state": "West Bengal", "lat": 22.5958, "lon": 88.2636},
    "bengaluru": {"state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    "bangalore": {"city": "Bengaluru", "state": "Karnataka", "lat": 12.9716, "lon": 77.5946},
    "chennai": {"state": "Tamil Nadu", "lat": 13.0827, "lon": 80.2707},
    "hyderabad": {"state": "Telangana", "lat": 17.3850, "lon": 78.4867},
    "ahmedabad": {"state": "Gujarat", "lat": 23.0225, "lon": 72.5714},
    "nagpur": {"state": "Maharashtra", "lat": 21.1458, "lon": 79.0882},
    "jaipur": {"state": "Rajasthan", "lat": 26.9124, "lon": 75.7873},
    "guwahati": {"state": "Assam", "lat": 26.1445, "lon": 91.7362}
}

class AIClassificationService:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "")

    def classify_report(self, text: str, user_claimed_type: str = None, user_city: str = None) -> Dict[str, Any]:
        """
        Classifies citizen text in English, Hindi, or Marathi into structured meteorological events.
        Uses OpenRouter LLM if available, with robust heuristic NLP fallback.
        """
        if self.api_key:
            try:
                llm_result = self._classify_via_llm(text)
                if llm_result:
                    return llm_result
            except Exception as e:
                logger.warning(f"LLM classification encountered error, falling back to local NLP engine: {e}")

        return self._classify_via_heuristic_nlp(text, user_claimed_type, user_city)

    def _classify_via_llm(self, text: str) -> Optional[Dict[str, Any]]:
        prompt = f"""
You are a senior meteorological NLP engine for India's National Weather Intelligence Platform.
Analyze the following citizen weather report (which may be in English, Hindi, or Marathi):
"{text}"

Output strict JSON with:
{{
  "event_type": "Heavy Rain" | "Flood" | "Thunderstorm" | "Heatwave" | "Fog" | "Dust Storm" | "Strong Wind" | "Other Weather Event",
  "severity": "LOW" | "MODERATE" | "HIGH" | "CRITICAL",
  "language": "en" | "hi" | "mr",
  "location_name": "<city or neighborhood if mentioned>",
  "water_logging_level": "<e.g. knee-deep, road submerged, none>",
  "confidence": 0.85,
  "summary": "<1 sentence english summary>"
}}
Return ONLY valid JSON.
"""
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://national-weather-intel.gov.in",
            "X-Title": "National Weather Event Intelligence"
        }
        payload = {
            "model": "google/gemini-2.0-flash-001",
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.1
        }
        res = requests.post("https://openrouter.ai/api/v1/chat/completions", headers=headers, json=payload, timeout=8)
        if res.status_code == 200:
            content = res.json()["choices"][0]["message"]["content"]
            clean_json = re.search(r"\{.*\}", content, re.DOTALL)
            if clean_json:
                data = json.loads(clean_json.group(0))
                # Normalize types
                event_type_str = data.get("event_type", "Heavy Rain")
                severity_str = data.get("severity", "MODERATE")
                return {
                    "event_type": self._map_event_type(event_type_str),
                    "severity": self._map_severity(severity_str),
                    "language": data.get("language", "en"),
                    "location_name": data.get("location_name", ""),
                    "entities": [data.get("water_logging_level", "")],
                    "confidence": float(data.get("confidence", 0.85)),
                    "summary": data.get("summary", text[:100]),
                    "engine": "OpenRouter LLM (Gemini 2.0 Flash)"
                }
        return None

    def _classify_via_heuristic_nlp(self, text: str, user_claimed_type: str = None, user_city: str = None) -> Dict[str, Any]:
        lower_text = text.lower()

        # Language Detection
        devanagari_chars = len(re.findall(r'[\u0900-\u097F]', text))
        total_chars = max(1, len(text))
        
        language = "en"
        if devanagari_chars / total_chars > 0.2:
            # Check Marathi vs Hindi markers
            marathi_markers = ["आहे", "झाला", "पाऊस", "पूर", "वाहतूक", "रस्ता", "पाणी", "खूप", "झाली", "झाले"]
            hindi_markers = ["है", "गया", "बारिश", "बाढ़", "पानी", "सड़क", "घुटनों", "बहुत", "हो", "रहा"]
            mr_count = sum(1 for m in marathi_markers if m in text)
            hi_count = sum(1 for m in hindi_markers if m in text)
            language = "mr" if mr_count > hi_count else "hi"
        else:
            # English or Romanized Hindi/Marathi (Hinglish)
            hinglish_markers = ["paani", "pani", "ghutno", "sadak", "barish", "toofan", "bahut", "band", "khup", "paus", "rasta"]
            if any(m in lower_text for m in hinglish_markers):
                language = "hi-Latin"

        # Event Type keyword dictionaries
        flood_keywords = [
            "flood", "flooding", "waterlogging", "water logging", "inundation", "submerged", "underwater",
            "paani bhar gaya", "pani bhar gaya", "ghutno tak", "sadak block", "rasta band", "water entering",
            "पूर", "पाणी साचले", "जलभराव", "बाढ़", "डूबा हुआ"
        ]
        rain_keywords = [
            "heavy rain", "torrential", "downpour", "raining cats and dogs", "continuous rain", "monsoon",
            "bhaari barish", "tez barish", "paus", "musaldhar", "मुसळधार", "भारी बारिश", "धुंआधार"
        ]
        thunder_keywords = [
            "thunder", "lightning", "storm", "squall", "cloudburst", "gust", "thunderstorm",
            "bijli", "toofan", "gadar", "garjana", "वादळ", "विजा", "तूफान"
        ]
        heat_keywords = [
            "heatwave", "scorching", "loo", "extremely hot", "high temperature", "heat stroke",
            "bheeshan garmi", "tapman", "उष्णतेची लाट", "भीषण गर्मी", "लू"
        ]
        fog_keywords = [
            "fog", "smog", "zero visibility", "dense fog", "mist", "dhundh", "kohra",
            "धुके", "कोहरा", "धुंध"
        ]
        wind_keywords = [
            "cyclone", "strong wind", "gale", "tree fallen", "uprooted", "flying debris",
            "hawa", "tez hawa", "वादळी वारे", "तेज हवा"
        ]

        event_type = EventType.OTHER
        if any(k in lower_text for k in flood_keywords):
            event_type = EventType.FLOOD
        elif any(k in lower_text for k in rain_keywords):
            event_type = EventType.HEAVY_RAIN
        elif any(k in lower_text for k in thunder_keywords):
            event_type = EventType.THUNDERSTORM
        elif any(k in lower_text for k in heat_keywords):
            event_type = EventType.HEATWAVE
        elif any(k in lower_text for k in fog_keywords):
            event_type = EventType.FOG
        elif any(k in lower_text for k in wind_keywords):
            event_type = EventType.STRONG_WIND
        elif user_claimed_type:
            event_type = self._map_event_type(user_claimed_type)

        # Severity Estimation
        critical_markers = ["completely blocked", "emergency", "stranded", "life threatening", "red alert", "rescue", "drowning", "घुटनों से ऊपर", "गंभीर", "कॉल करा"]
        high_markers = ["ghutno tak", "heavy", "severe", "submerged", "traffic jammed", "bad", "high", "खूप", "फार", "काफी पानी"]
        
        severity = Severity.MODERATE
        if any(m in lower_text for m in critical_markers):
            severity = Severity.CRITICAL
        elif any(m in lower_text for m in high_markers) or event_type in [EventType.FLOOD, EventType.THUNDERSTORM]:
            severity = Severity.HIGH
        elif "mild" in lower_text or "light" in lower_text:
            severity = Severity.LOW

        # Location entity extraction
        detected_loc = None
        for loc_key, loc_info in INDIAN_CITIES_GAZETTEER.items():
            if re.search(r'\b' + re.escape(loc_key) + r'\b', lower_text):
                detected_loc = loc_key.capitalize()
                break

        confidence = 0.88 if (event_type != EventType.OTHER and detected_loc) else 0.72

        return {
            "event_type": event_type,
            "severity": severity,
            "language": language,
            "location_name": detected_loc or user_city or "Unknown",
            "entities": ["waterlogging", "transport disruption"] if event_type == EventType.FLOOD else ["meteorological alert"],
            "confidence": confidence,
            "summary": f"{severity.value} {event_type.value} reported in {detected_loc or user_city or 'local region'}.",
            "engine": "Deterministic Multilingual NLP (Indo-Lexical Engine)"
        }

    def _map_event_type(self, val: str) -> EventType:
        norm = val.lower()
        if "flood" in norm:
            return EventType.FLOOD
        if "rain" in norm:
            return EventType.HEAVY_RAIN
        if "thunder" in norm or "lightning" in norm:
            return EventType.THUNDERSTORM
        if "heat" in norm:
            return EventType.HEATWAVE
        if "fog" in norm or "smog" in norm:
            return EventType.FOG
        if "dust" in norm:
            return EventType.DUST_STORM
        if "wind" in norm or "cyclone" in norm:
            return EventType.STRONG_WIND
        return EventType.OTHER

    def _map_severity(self, val: str) -> Severity:
        norm = val.upper()
        if "CRIT" in norm:
            return Severity.CRITICAL
        if "HIGH" in norm:
            return Severity.HIGH
        if "LOW" in norm:
            return Severity.LOW
        return Severity.MODERATE

ai_classifier = AIClassificationService()
