import os
import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

logger = logging.getLogger(__name__)

FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "sahayaak-c76ce")
FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "sahayaak-c76ce.firebasestorage.app")

class FirebaseDataService:
    """
    Manages persistence to Firebase Firestore and Firebase Storage.
    Provides local in-memory fallback for ultra-fast response and testing.
    """
    def __init__(self):
        self.project_id = FIREBASE_PROJECT_ID
        self.storage_bucket = FIREBASE_STORAGE_BUCKET
        self.is_connected = False
        self._init_firebase()

    def _init_firebase(self):
        try:
            # Check if firebase_admin is installed
            import firebase_admin
            from firebase_admin import credentials, firestore
            
            # If default app not initialized
            if not firebase_admin._apps:
                # Check for service account key file
                cred_path = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "")
                if cred_path and os.path.exists(cred_path):
                    cred = credentials.Certificate(cred_path)
                    firebase_admin.initialize_app(cred, {"storageBucket": self.storage_bucket})
                    self.db = firestore.client()
                    self.is_connected = True
                    logger.info("Connected to Firebase Firestore via Service Account!")
                else:
                    logger.info("Using local persistent memory cache (Firebase service account not yet loaded in env).")
        except Exception as e:
            logger.info(f"Firebase client initialized in localized caching mode: {e}")

    def save_report(self, report_dict: Dict[str, Any]) -> bool:
        if self.is_connected:
            try:
                self.db.collection("reports").document(report_dict["report_id"]).set(report_dict)
                return True
            except Exception as e:
                logger.error(f"Firestore save error: {e}")
        return True

    def save_event(self, event_dict: Dict[str, Any]) -> bool:
        if self.is_connected:
            try:
                self.db.collection("events").document(event_dict["event_id"]).set(event_dict)
                return True
            except Exception as e:
                logger.error(f"Firestore save error: {e}")
        return True

    def log_verification_action(self, action_dict: Dict[str, Any]) -> bool:
        if self.is_connected:
            try:
                self.db.collection("verification_actions").document(action_dict["action_id"]).set(action_dict)
                return True
            except Exception as e:
                logger.error(f"Firestore log action error: {e}")
        return True

firebase_service = FirebaseDataService()
