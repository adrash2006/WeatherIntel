import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def test_full_pipeline():
    print("=" * 60)
    print("TESTING NATIONAL WEATHER EVENT INTELLIGENCE PIPELINE")
    print("=" * 60)

    # 1. Health check
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("[1/5] Health Check: PASS", r.json())

    # 2. Ingest Hindi Citizen Report
    print("\n[2/5] Ingesting Citizen Report (Hindi): 'Paani ghutno tak bhar gaya hai...'")
    payload = {
        "description": "Paani ghutno tak bhar gaya hai, road completely blocked near Andheri subway!",
        "event_type": "Flood",
        "city": "Mumbai",
        "state": "Maharashtra",
        "latitude": 19.1136,
        "longitude": 72.8697,
        "landmark": "Andheri Subway",
        "is_anonymous": False,
        "consent_given": True
    }
    r = requests.post(f"{BASE_URL}/api/reports", data=payload)
    assert r.status_code == 200, f"Citizen submission failed: {r.text}"
    rep_res = r.json()
    print("      -> Report ID:", rep_res["report_id"])
    print("      -> Fused Event ID:", rep_res["event_id"])
    print("      -> AI Classified Language:", rep_res["ai_extracted"]["language"])
    print("      -> AI Classified Type:", rep_res["ai_extracted"]["event_type"])
    print("      -> Event Confidence:", rep_res["confidence"], "%")
    print("      -> Status:", rep_res["verification_status"])

    event_id = rep_res["event_id"]

    # 3. Inspect Event Dossier & Confidence Breakdown
    print(f"\n[3/5] Inspecting Event Dossier for {event_id}...")
    r = requests.get(f"{BASE_URL}/api/events/{event_id.replace('#', '')}")
    assert r.status_code == 200, f"Dossier fetch failed: {r.text}"
    event_data = r.json()
    print("      -> Title:", event_data["title"])
    print("      -> Reports Count:", event_data["reports_count"])
    print("      -> Contributing Confidence Factors:")
    for factor in event_data["confidence_breakdown"]:
        print(f"         * {factor['factor']}: {factor['delta']} pts ({factor['source']})")

    # 4. Human Verification Action
    print(f"\n[4/5] Admin Action: Transitioning Status to 'VERIFIED'...")
    verify_payload = {
        "analyst_name": "Senior Met Duty Officer (NDRF HQ)",
        "new_status": "VERIFIED",
        "notes": "Corroborated with Santacruz AWS 64.5mm/hr radar echo. Evacuation alert authorized."
    }
    r = requests.post(f"{BASE_URL}/api/events/{event_id.replace('#', '')}/verify", json=verify_payload)
    assert r.status_code == 200, f"Verification failed: {r.text}"
    print("      -> Verification Result:", r.json()["new_status"])

    # 5. Operational Metrics Check
    print("\n[5/5] Fetching Live Platform Metrics...")
    r = requests.get(f"{BASE_URL}/api/metrics")
    assert r.status_code == 200, f"Metrics failed: {r.text}"
    metrics = r.json()
    print("      -> Total Reports Processed:", metrics["reports_processed"])
    print("      -> Events Detected:", metrics["events_detected"])
    print("      -> Corroborated Events:", metrics["corroborated_events"])
    print("      -> Duplicate Reports Merged:", metrics["duplicate_reports"])
    print("      -> Avg Processing Latency:", metrics["avg_processing_latency_sec"], "sec")

    print("\n" + "=" * 60)
    print("ALL ACCEPTANCE CRITERIA VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    test_full_pipeline()
