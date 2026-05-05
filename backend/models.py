from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

# ============================================================================
# CORE MODELS
# ============================================================================

class User(Base):
    """Public user accounts with mandatory registration"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    ppsn_hash = Column(String(255), unique=True, nullable=True)  # Irish social security number (hashed)
    passport_hash = Column(String(255), unique=True, nullable=True)  # Passport number (hashed)
    biometric_hash = Column(String(255), nullable=False)  # Face ID/Fingerprint hash
    is_child = Column(Boolean, default=False)  # Child Mode (8-15 years)
    parent_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Link to parent account
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    sos_calls = relationship("SOSQueue", back_populates="user")
    medical_profile = relationship("MedicalProfile", back_populates="user", uselist=False)
    safe_walk_journeys = relationship("SafeWalkJourney", back_populates="user")
    danger_zone_reports = relationship("DangerZone", back_populates="user")
    posts = relationship("Post", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")

    # Profile Fields
    bio = Column(Text, nullable=True)
    avatar_url = Column(String(500), nullable=True)
    reputation_score = Column(Integer, default=0)


class Garda(Base):
    """Garda (Irish police) accounts with station assignment"""
    __tablename__ = "garda"
    
    id = Column(Integer, primary_key=True, index=True)
    garda_id = Column(String(50), unique=True, nullable=False)  # Official Garda ID
    name = Column(String(255), nullable=False)
    biometric_hash = Column(String(255), nullable=False)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=False)
    is_on_duty = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)  # Current location (for live tracking)
    longitude = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    station = relationship("Station", back_populates="gardai")


class Station(Base):
    """300 Garda stations across Ireland"""
    __tablename__ = "stations"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500), nullable=False)
    
    # Relationships
    gardai = relationship("Garda", back_populates="station")
    sos_calls = relationship("SOSQueue", back_populates="station")


class SOSQueue(Base):
    """Active SOS emergency calls"""
    __tablename__ = "sos_queue"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(50), default="Active")  # Active, Rerouted, Resolved
    video_url = Column(String(500), nullable=True)  # 10-second video recording
    eta = Column(String(50), nullable=True)  # Estimated time of arrival
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    priority = Column(String(50), default="Normal")  # Normal, High (for DV alerts)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="sos_calls")
    station = relationship("Station", back_populates="sos_calls")


class CrimeHotspot(Base):
    """Predicted crime hotspots (85% accurate from SentinelAI)"""
    __tablename__ = "crime_hotspots"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    description = Column(Text, nullable=True)
    risk_level = Column(String(50), default="Medium")  # Low, Medium, High
    created_at = Column(DateTime, default=datetime.utcnow)


class Feedback(Base):
    """User feedback"""
    __tablename__ = "feedback"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    message = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============================================================================
# PREMIUM FEATURE MODELS
# ============================================================================

class MedicalProfile(Base):
    """Emergency medical information (Feature #9)"""
    __tablename__ = "medical_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)
    blood_type = Column(String(10), nullable=True)  # A+, O-, etc.
    allergies = Column(Text, nullable=True)  # Comma-separated list
    conditions = Column(Text, nullable=True)  # Medical conditions
    medications = Column(Text, nullable=True)  # Current medications
    emergency_contact = Column(String(255), nullable=True)  # Phone number
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="medical_profile")


class DangerZone(Base):
    """Crowd-sourced danger zones (Feature #7)"""
    __tablename__ = "danger_zones"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    verified = Column(Boolean, default=True)  # Verified users only
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="danger_zone_reports")


class SafeWalkJourney(Base):
    """Safe Walk Home Mode tracking (Feature #3)"""
    __tablename__ = "safe_walk_journeys"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    start_lat = Column(Float, nullable=False)
    start_lng = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=True)
    end_lng = Column(Float, nullable=True)
    status = Column(String(50), default="Active")  # Active, Completed, Emergency
    guardian_ids = Column(JSON, nullable=True)  # List of guardian user IDs
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="safe_walk_journeys")


class SupportService(Base):
    """Post-Incident Support Hub contacts (Feature #10)"""
    __tablename__ = "support_services"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    category = Column(String(100), nullable=False)  # rape_crisis, womens_aid, samaritans, etc.
    description = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)


class LockdownAlert(Base):
    """National Lockdown Mode alerts (Ireland Shield)"""
    __tablename__ = "lockdown_alerts"
    
    id = Column(Integer, primary_key=True, index=True)
    message = Column(Text, nullable=False)  # Government emergency message
    safe_routes = Column(JSON, nullable=True)  # List of safe routes to shelters
    status = Column(String(50), default="Active")  # Active, Resolved
    triggered_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    
    # Relationships
    safe_check_ins = relationship("SafeCheckIn", back_populates="lockdown_alert")


class SafeCheckIn(Base):
    """'I'm safe' check-ins during lockdown"""
    __tablename__ = "safe_check_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lockdown_alert_id = Column(Integer, ForeignKey("lockdown_alerts.id"), nullable=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    checked_in_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    lockdown_alert = relationship("LockdownAlert", back_populates="safe_check_ins")


# ============================================================================
# COMMUNITY & GAMIFICATION MODELS
# ============================================================================

class Post(Base):
    """Community Safety Feed Posts"""
    __tablename__ = "posts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    type = Column(String(50), default="info")  # alert, help, info
    location = Column(String(255), nullable=True)  # "Dublin 1", "Cork City"
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="posts")


class Badge(Base):
    """Gamification Badges"""
    __tablename__ = "badges"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    icon = Column(String(50), nullable=False)  # e.g., "shield", "star"
    description = Column(Text, nullable=False)
    criteria = Column(String(255), nullable=True)  # e.g., "Report 5 hazards"


class UserBadge(Base):
    """Badges earned by users"""
    __tablename__ = "user_badges"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    awarded_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")
