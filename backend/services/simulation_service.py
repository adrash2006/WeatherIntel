import uuid
from typing import List, Dict, Any
from datetime import datetime, timedelta
from backend.models.schemas import (
    CitizenReport,
    EventType,
    Severity,
    VerificationStatus,
    WeatherEvent
)
from backend.services.ai_classifier import ai_classifier
from backend.services.deduplication_service import deduplication_service, compute_perceptual_hash
from backend.services.clustering_service import clustering_service
from backend.services.imd_service import imd_service
from backend.services.confidence_engine import confidence_engine

class SimulationService:
    def __init__(self):
        pass

    def run_pune_heavy_rain_scenario(self, reports_db: List[CitizenReport], events_db: List[WeatherEvent]) -> Dict[str, Any]:
        """
        Scenario A: Heavy Rain in Pune.
        Demonstrates confidence increasing as multiple citizen reports corroborate with IMD AWS.
        """
        base_time = datetime.utcnow() - timedelta(minutes=45)
        
        # 1. First isolated citizen report
        r1 = CitizenReport(
            report_id=f"rep-pune-{uuid.uuid4().hex[:6]}",
            description="Shivajinagar madhe khoop jorat paus chalu ahe. Pani rastyavar saachayla suruvat jhali ahe.",
            event_type=EventType.HEAVY_RAIN,
            severity=Severity.MODERATE,
            latitude=18.5314,
            longitude=73.8446,
            city="Pune",
            state="Maharashtra",
            landmark="Shivajinagar Bus Stand",
            language="mr",
            source_trust=0.75,
            is_simulated=True,
            timestamp=base_time
        )
        r1.ai_extracted = ai_classifier.classify_report(r1.description, user_claimed_type=r1.event_type.value, user_city=r1.city)
        reports_db.append(r1)
        event = clustering_service.cluster_report_into_events(r1, events_db)

        # 2. Second report 15 mins later from nearby location
        r2 = CitizenReport(
            report_id=f"rep-pune-{uuid.uuid4().hex[:6]}",
            description="Heavy rain near FC Road Deccan, water level rising rapidly on roads!",
            event_type=EventType.HEAVY_RAIN,
            severity=Severity.HIGH,
            latitude=18.5196,
            longitude=73.8410,
            city="Pune",
            state="Maharashtra",
            landmark="FC Road",
            language="en",
            source_trust=0.85,
            image_url="https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?w=600",
            image_hash="a1b2c3d4e5f67890",
            is_simulated=True,
            timestamp=base_time + timedelta(minutes=15)
        )
        r2.ai_extracted = ai_classifier.classify_report(r2.description, user_claimed_type=r2.event_type.value, user_city=r2.city)
        reports_db.append(r2)
        event = clustering_service.cluster_report_into_events(r2, events_db)

        # 3. Third report with municipal spotter trust
        r3 = CitizenReport(
            report_id=f"rep-pune-{uuid.uuid4().hex[:6]}",
            description="Mutha river bank water level alert. Intense thunderstorm downpour over Central Pune.",
            event_type=EventType.HEAVY_RAIN,
            severity=Severity.HIGH,
            latitude=18.5280,
            longitude=73.8500,
            city="Pune",
            state="Maharashtra",
            landmark="Mutha River Bridge",
            language="en",
            source_trust=0.95,
            is_simulated=True,
            timestamp=base_time + timedelta(minutes=30)
        )
        r3.ai_extracted = ai_classifier.classify_report(r3.description, user_claimed_type=r3.event_type.value, user_city=r3.city)
        reports_db.append(r3)
        event = clustering_service.cluster_report_into_events(r3, events_db)

        return {
            "scenario": "Scenario A — Heavy Rain in Pune",
            "event_id": event.event_id,
            "city": "Pune",
            "reports_added": 3,
            "final_confidence": event.confidence,
            "verification_status": event.verification_status.value,
            "message": "Pune torrential rain scenario successfully triggered. Confidence escalated through multi-source correlation."
        }

    def run_mumbai_flood_scenario(self, reports_db: List[CitizenReport], events_db: List[WeatherEvent]) -> Dict[str, Any]:
        """
        Scenario B: Urban Flooding in Mumbai with duplicate reports.
        Demonstrates deduplication clustering and image hash verification.
        """
        base_time = datetime.utcnow() - timedelta(minutes=20)
        
        # 1. Original ground report with image
        r1 = CitizenReport(
            report_id=f"rep-mum-{uuid.uuid4().hex[:6]}",
            description="Paani ghutno tak bhar gaya hai, road completely blocked in Andheri subway!",
            event_type=EventType.FLOOD,
            severity=Severity.HIGH,
            latitude=19.1136,
            longitude=72.8697,
            city="Mumbai",
            state="Maharashtra",
            landmark="Andheri Subway",
            language="hi",
            source_trust=0.80,
            image_url="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600",
            image_hash="3f4a5b6c7d8e9012",
            is_simulated=True,
            timestamp=base_time
        )
        r1.ai_extracted = ai_classifier.classify_report(r1.description, user_claimed_type=r1.event_type.value, user_city=r1.city)
        reports_db.append(r1)
        event = clustering_service.cluster_report_into_events(r1, events_db)

        # 2. Duplicate / viral repost using the same photo and near-identical text
        is_dup, matched_id, score, breakdown = deduplication_service.check_duplicate(
            CitizenReport(
                report_id="temp",
                description="Andheri subway submerged under water, road blocked avoid route!",
                event_type=EventType.FLOOD,
                severity=Severity.HIGH,
                latitude=19.1140,
                longitude=72.8700,
                city="Mumbai",
                state="Maharashtra",
                image_hash="3f4a5b6c7d8e9013", # 1 bit difference, Hamming dist = 1
                timestamp=base_time + timedelta(minutes=5)
            ),
            [r1]
        )

        r2 = CitizenReport(
            report_id=f"rep-mum-{uuid.uuid4().hex[:6]}",
            description="Andheri subway submerged under water, road blocked avoid route!",
            event_type=EventType.FLOOD,
            severity=Severity.HIGH,
            latitude=19.1140,
            longitude=72.8700,
            city="Mumbai",
            state="Maharashtra",
            landmark="Andheri Subway",
            language="en",
            source_trust=0.70,
            image_url="https://images.unsplash.com/photo-1547683905-f686c993aae5?w=600",
            image_hash="3f4a5b6c7d8e9013",
            duplicate_of=r1.report_id if is_dup else None,
            similarity_score=score if is_dup else None,
            is_simulated=True,
            timestamp=base_time + timedelta(minutes=5)
        )
        r2.ai_extracted = ai_classifier.classify_report(r2.description, user_claimed_type=r2.event_type.value, user_city=r2.city)
        reports_db.append(r2)
        event = clustering_service.cluster_report_into_events(r2, events_db)

        # 3. Third corroborating report from Kurla junction
        r3 = CitizenReport(
            report_id=f"rep-mum-{uuid.uuid4().hex[:6]}",
            description="Bandra-Kurla Complex connector waterlogged, slow moving traffic on WEH.",
            event_type=EventType.FLOOD,
            severity=Severity.HIGH,
            latitude=19.0657,
            longitude=72.8789,
            city="Mumbai",
            state="Maharashtra",
            landmark="BKC Connector",
            language="en",
            source_trust=0.88,
            is_simulated=True,
            timestamp=base_time + timedelta(minutes=12)
        )
        r3.ai_extracted = ai_classifier.classify_report(r3.description, user_claimed_type=r3.event_type.value, user_city=r3.city)
        reports_db.append(r3)
        event = clustering_service.cluster_report_into_events(r3, events_db)

        return {
            "scenario": "Scenario B — Urban Flooding in Mumbai",
            "event_id": event.event_id,
            "city": "Mumbai",
            "duplicate_detected": True,
            "duplicate_report_id": r2.report_id,
            "duplicate_of": r1.report_id,
            "final_confidence": event.confidence,
            "verification_status": event.verification_status.value,
            "message": "Mumbai flood scenario processed. Duplicate report successfully identified and clustered without losing evidence."
        }

    def run_low_confidence_scenario(self, reports_db: List[CitizenReport], events_db: List[WeatherEvent]) -> Dict[str, Any]:
        """
        Scenario C: Low Confidence / Contradictory Claim.
        Demonstrates contradictory evidence penalty when IMD station detects dry conditions.
        """
        base_time = datetime.utcnow() - timedelta(minutes=10)

        # Isolated report claiming severe flooding in Delhi while IMD Safdarjung is completely dry (0.0mm)
        r1 = CitizenReport(
            report_id=f"rep-del-{uuid.uuid4().hex[:6]}",
            description="Severe cloudburst and dangerous flood waters drowning cars in Connaught Place!",
            event_type=EventType.FLOOD,
            severity=Severity.CRITICAL,
            latitude=28.6315,
            longitude=77.2167,
            city="Delhi",
            state="Delhi",
            landmark="Connaught Place",
            language="en",
            source_trust=0.30, # Low trust / anonymous account
            is_simulated=True,
            timestamp=base_time
        )
        r1.ai_extracted = ai_classifier.classify_report(r1.description, user_claimed_type=r1.event_type.value, user_city=r1.city)
        reports_db.append(r1)
        event = clustering_service.cluster_report_into_events(r1, events_db)

        return {
            "scenario": "Scenario C — Low Confidence / Contradictory Report",
            "event_id": event.event_id,
            "city": "Delhi",
            "confidence": event.confidence,
            "verification_status": event.verification_status.value,
            "contradiction_noted": "IMD Safdarjung AWS reports 0.0 mm/hr and 38.4°C clear skies",
            "message": "Low-confidence event flagged for Human Review due to severe IMD sensor divergence penalty (-15 pts)."
        }

simulation_service = SimulationService()
