from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class EventType(str, Enum):
    HEAVY_RAIN = "Heavy Rain"
    FLOOD = "Flood"
    THUNDERSTORM = "Thunderstorm"
    HEATWAVE = "Heatwave"
    FOG = "Fog"
    DUST_STORM = "Dust Storm"
    STRONG_WIND = "Strong Wind"
    OTHER = "Other Weather Event"

class Severity(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class VerificationStatus(str, Enum):
    NEW = "NEW"
    UNVERIFIED = "UNVERIFIED"
    LOW_CONFIDENCE = "LOW CONFIDENCE"
    CORROBORATED = "CORROBORATED"
    HIGH_CONFIDENCE = "HIGH CONFIDENCE"
    UNDER_HUMAN_REVIEW = "UNDER HUMAN REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class EvidenceContribution(BaseModel):
    factor: str
    delta: float
    source: str
    description: str

class IMDObservation(BaseModel):
    station_id: str
    station_name: str
    latitude: float
    longitude: float
    city: str
    state: str
    rainfall_mm_hr: float
    temp_celsius: float
    wind_speed_kmh: float
    radar_reflectivity_dbz: Optional[float] = None
    warning_level: str = "GREEN"  # GREEN, YELLOW, ORANGE, RED
    observed_at: datetime = Field(default_factory=datetime.utcnow)
    is_simulated: bool = False

class CitizenReport(BaseModel):
    report_id: str
    description: str
    event_type: EventType
    severity: Severity
    latitude: float
    longitude: float
    city: str
    state: str
    landmark: Optional[str] = None
    language: str = "en"
    image_url: Optional[str] = None
    image_hash: Optional[str] = None
    source_trust: float = 0.75
    is_anonymous: bool = False
    is_simulated: bool = False
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    ai_extracted: Optional[Dict[str, Any]] = None
    duplicate_of: Optional[str] = None
    similarity_score: Optional[float] = None

class VerificationAction(BaseModel):
    action_id: str
    event_id: str
    analyst_name: str
    old_status: VerificationStatus
    new_status: VerificationStatus
    notes: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WeatherEvent(BaseModel):
    event_id: str
    title: str
    event_type: EventType
    severity: Severity
    city: str
    state: str
    latitude: float
    longitude: float
    affected_radius_km: float = 5.0
    confidence: float
    verification_status: VerificationStatus
    confidence_breakdown: List[EvidenceContribution] = Field(default_factory=list)
    reports_count: int = 1
    report_ids: List[str] = Field(default_factory=list)
    reports: List[CitizenReport] = Field(default_factory=list)
    imd_observations: List[IMDObservation] = Field(default_factory=list)
    duplicate_count: int = 0
    media_count: int = 0
    timeline: List[Dict[str, Any]] = Field(default_factory=list)
    verification_notes: List[VerificationAction] = Field(default_factory=list)
    is_simulated: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SystemMetrics(BaseModel):
    reports_processed: int
    events_detected: int
    duplicate_reports: int
    corroborated_events: int
    human_review_required: int
    avg_processing_latency_sec: float
    active_events_count: int
    avg_confidence: float
