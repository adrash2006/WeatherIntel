import io
import math
import hashlib
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
from PIL import Image
from backend.models.schemas import CitizenReport
from backend.services.imd_service import calculate_haversine_distance

def compute_perceptual_hash(image_bytes: bytes) -> str:
    """
    Computes a 64-bit difference hash (dHash) for an image.
    Resizes image to 9x8, converts to grayscale, and compares adjacent pixels.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('L').resize((9, 8), Image.Resampling.LANCZOS)
        pixels = list(img.getdata())
        difference = []
        for row in range(8):
            for col in range(8):
                pixel_left = pixels[row * 9 + col]
                pixel_right = pixels[row * 9 + col + 1]
                difference.append(pixel_left > pixel_right)
        
        # Convert bit array to hex string
        decimal_val = 0
        for idx, val in enumerate(difference):
            if val:
                decimal_val |= 1 << (63 - idx)
        return f"{decimal_val:016x}"
    except Exception:
        # Fallback to sha256 prefix if image parsing fails
        return hashlib.sha256(image_bytes).hexdigest()[:16]

def hamming_distance(hash1: str, hash2: str) -> int:
    """Calculates bitwise Hamming distance between two hex hash strings."""
    try:
        val1 = int(hash1, 16)
        val2 = int(hash2, 16)
        xor_val = val1 ^ val2
        return bin(xor_val).count('1')
    except Exception:
        return 64

def calculate_text_similarity(t1: str, t2: str) -> float:
    """Computes token Jaccard similarity between two texts."""
    words1 = set(t1.lower().split())
    words2 = set(t2.lower().split())
    if not words1 or not words2:
        return 0.0
    intersection = words1.intersection(words2)
    union = words1.union(words2)
    return len(intersection) / len(union)

class DeduplicationService:
    def __init__(self, spatial_threshold_km: float = 6.0, time_threshold_minutes: float = 120.0):
        self.spatial_threshold_km = spatial_threshold_km
        self.time_threshold_minutes = time_threshold_minutes

    def check_duplicate(self, candidate: CitizenReport, existing_reports: List[CitizenReport]) -> Tuple[bool, Optional[str], float, Dict[str, Any]]:
        """
        Compares candidate report against existing reports.
        Returns:
            is_duplicate (bool)
            matched_report_id (Optional[str])
            combined_similarity_score (float, 0.0 to 1.0)
            breakdown (dict of factor similarities)
        """
        best_match_id = None
        best_score = 0.0
        best_breakdown = {}

        for rep in existing_reports:
            # 1. Spatial Similarity (1.0 at 0km distance, 0.0 at spatial_threshold_km)
            dist_km = calculate_haversine_distance(candidate.latitude, candidate.longitude, rep.latitude, rep.longitude)
            if dist_km > self.spatial_threshold_km:
                spatial_sim = 0.0
            else:
                spatial_sim = max(0.0, 1.0 - (dist_km / self.spatial_threshold_km))

            # 2. Temporal Similarity (1.0 at 0 time delta, 0.0 at time_threshold_minutes)
            time_delta_mins = abs((candidate.timestamp - rep.timestamp).total_seconds()) / 60.0
            if time_delta_mins > self.time_threshold_minutes:
                temporal_sim = 0.0
            else:
                temporal_sim = max(0.0, 1.0 - (time_delta_mins / self.time_threshold_minutes))

            # 3. Text Similarity
            text_sim = calculate_text_similarity(candidate.description, rep.description)

            # 4. Image Similarity
            image_sim = 0.0
            if candidate.image_hash and rep.image_hash:
                h_dist = hamming_distance(candidate.image_hash, rep.image_hash)
                # Hamming distance <= 10 out of 64 bits considered high similarity
                image_sim = max(0.0, 1.0 - (h_dist / 20.0))

            # 5. Event Type Match
            type_sim = 1.0 if candidate.event_type == rep.event_type else 0.4

            # Combined Score Formula
            combined = (
                0.25 * spatial_sim +
                0.20 * temporal_sim +
                0.25 * text_sim +
                0.20 * image_sim +
                0.10 * type_sim
            )

            # High confidence duplicate condition
            is_dup_candidate = (
                (image_sim > 0.85 and spatial_sim > 0.6) or
                (text_sim > 0.75 and spatial_sim > 0.7 and temporal_sim > 0.5) or
                (combined >= 0.70)
            )

            if combined > best_score:
                best_score = combined
                best_match_id = rep.report_id
                best_breakdown = {
                    "matched_report_id": rep.report_id,
                    "spatial_sim": round(spatial_sim, 3),
                    "temporal_sim": round(temporal_sim, 3),
                    "text_sim": round(text_sim, 3),
                    "image_sim": round(image_sim, 3),
                    "type_sim": round(type_sim, 3),
                    "distance_km": round(dist_km, 2),
                    "time_delta_mins": round(time_delta_mins, 1),
                    "combined_score": round(combined, 3)
                }

        is_duplicate = best_score >= 0.68
        return is_duplicate, best_match_id if is_duplicate else None, best_score, best_breakdown

deduplication_service = DeduplicationService()
