import uuid
from typing import List, Dict, Optional
from datetime import datetime
from backend.models.schemas import (
    CitizenReport,
    WeatherEvent,
    EventType,
    Severity,
    VerificationStatus
)
from backend.services.imd_service import calculate_haversine_distance, imd_service
from backend.services.confidence_engine import confidence_engine

class EventClusteringService:
    def __init__(self, cluster_radius_km: float = 12.0, time_window_hours: float = 4.0):
        self.cluster_radius_km = cluster_radius_km
        self.time_window_hours = time_window_hours

    def cluster_report_into_events(
        self,
        report: CitizenReport,
        active_events: List[WeatherEvent]
    ) -> WeatherEvent:
        """
        Ingests a single report, finds if an existing spatial-temporal cluster exists.
        If yes, merges the report into that WeatherEvent and updates confidence.
        If no, instantiates a new WeatherEvent.
        """
        matched_event: Optional[WeatherEvent] = None
        min_distance = float('inf')

        for event in active_events:
            # 1. Type Match or related category (e.g. Heavy Rain <-> Flood)
            type_compat = (
                event.event_type == report.event_type or
                (event.event_type in [EventType.HEAVY_RAIN, EventType.FLOOD] and report.event_type in [EventType.HEAVY_RAIN, EventType.FLOOD])
            )
            if not type_compat:
                continue

            # 2. Spatial Distance
            dist = calculate_haversine_distance(report.latitude, report.longitude, event.latitude, event.longitude)
            if dist <= self.cluster_radius_km and dist < min_distance:
                # 3. Temporal Window
                time_diff = abs((report.timestamp - event.updated_at).total_seconds()) / 3600.0
                if time_diff <= self.time_window_hours:
                    min_distance = dist
                    matched_event = event

        if matched_event:
            # Merge report into existing event
            matched_event.reports.append(report)
            matched_event.report_ids.append(report.report_id)
            matched_event.reports_count = len(matched_event.reports)

            # Update Centroid coordinates (weighted average)
            total_lat = sum(r.latitude for r in matched_event.reports)
            total_lon = sum(r.longitude for r in matched_event.reports)
            matched_event.latitude = round(total_lat / matched_event.reports_count, 4)
            matched_event.longitude = round(total_lon / matched_event.reports_count, 4)

            # Recalculate affected radius
            max_r = max(calculate_haversine_distance(matched_event.latitude, matched_event.longitude, r.latitude, r.longitude) for r in matched_event.reports)
            matched_event.affected_radius_km = round(max(3.0, max_r + 2.0), 1)

            # Update severity if incoming report is higher
            if report.severity == Severity.CRITICAL:
                matched_event.severity = Severity.CRITICAL
            elif report.severity == Severity.HIGH and matched_event.severity in [Severity.LOW, Severity.MODERATE]:
                matched_event.severity = Severity.HIGH

            matched_event.updated_at = datetime.utcnow()
            matched_event.timeline.append({
                "time": report.timestamp.strftime("%H:%M:%S"),
                "type": "CITIZEN_REPORT_MERGED",
                "summary": f"Report #{report.report_id[-4:]} merged into cluster from {report.city}."
            })

            # Check if this report is a duplicate
            if report.duplicate_of:
                matched_event.duplicate_count += 1

            if report.image_url:
                matched_event.media_count += 1

            # Re-evaluate confidence
            score, status, breakdown = confidence_engine.calculate_confidence(
                reports=matched_event.reports,
                imd_obs=matched_event.imd_observations,
                event_type=matched_event.event_type
            )
            matched_event.confidence = score
            if matched_event.verification_status not in [VerificationStatus.VERIFIED, VerificationStatus.REJECTED]:
                matched_event.verification_status = status
            matched_event.confidence_breakdown = breakdown

            return matched_event
        else:
            # Create a New WeatherEvent
            city_code = (report.city[:3] if report.city else "IND").upper()
            event_id = f"#{city_code}-{datetime.utcnow().strftime('%Y%m%d')}-{uuid.uuid4().hex[:3].upper()}"

            # Fetch nearest IMD observation
            imd_obs_list = []
            nearest_imd = imd_service.get_observation_for_event(report.latitude, report.longitude, report.city)
            if nearest_imd:
                imd_obs_list.append(nearest_imd)

            score, status, breakdown = confidence_engine.calculate_confidence(
                reports=[report],
                imd_obs=imd_obs_list,
                event_type=report.event_type
            )

            new_event = WeatherEvent(
                event_id=event_id,
                title=f"{report.severity.value} {report.event_type.value} - {report.city}",
                event_type=report.event_type,
                severity=report.severity,
                city=report.city,
                state=report.state,
                latitude=report.latitude,
                longitude=report.longitude,
                affected_radius_km=4.5,
                confidence=score,
                verification_status=status,
                confidence_breakdown=breakdown,
                reports_count=1,
                report_ids=[report.report_id],
                reports=[report],
                imd_observations=imd_obs_list,
                duplicate_count=1 if report.duplicate_of else 0,
                media_count=1 if report.image_url else 0,
                timeline=[
                    {
                        "time": report.timestamp.strftime("%H:%M:%S"),
                        "type": "EVENT_INITIATED",
                        "summary": f"Initial report detected in {report.city} by citizen mesh."
                    }
                ],
                is_simulated=report.is_simulated,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )

            if imd_obs_list:
                new_event.timeline.append({
                    "time": datetime.utcnow().strftime("%H:%M:%S"),
                    "type": "IMD_CORRELATED",
                    "summary": f"Correlated with IMD AWS ({imd_obs_list[0].station_name}): {imd_obs_list[0].rainfall_mm_hr} mm/hr."
                })

            active_events.append(new_event)
            return new_event

clustering_service = EventClusteringService()
