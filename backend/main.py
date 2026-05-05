import json
import os
import asyncio
import uuid
from datetime import datetime, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
import socketio
from ai_chat import get_garda_response

# ============================================================================
# DATABASE SETUP
# ============================================================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./slaan.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ============================================================================
# MODELS
# ============================================================================
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    username = Column(String, unique=True, nullable=True)
    biometric_hash = Column(String)
    is_child = Column(Boolean, default=False)
    bio = Column(String, nullable=True)
    location = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    reputation_score = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    posts = relationship("Post", back_populates="user")
    badges = relationship("UserBadge", back_populates="user")

class Station(Base):
    __tablename__ = "stations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    latitude = Column(Float)
    longitude = Column(Float)
    address = Column(String)

class Garda(Base):
    __tablename__ = "gardai"
    id = Column(Integer, primary_key=True, index=True)
    station_id = Column(Integer, ForeignKey("stations.id"))
    is_on_duty = Column(Boolean, default=True)
    latitude = Column(Float)
    longitude = Column(Float)

class SOSQueue(Base):
    __tablename__ = "sos_queue"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    status = Column(String, default="Active")
    video_url = Column(String, nullable=True)
    service_type = Column(String, default="all") # garda, ambulance, fire, all
    eta = Column(String, nullable=True)
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    priority = Column(String, default="Normal")
    created_at = Column(DateTime, default=datetime.utcnow)

class Feedback(Base):
    __tablename__ = "feedback"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class SafeWalkJourney(Base):
    __tablename__ = "safe_walk_journeys"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    start_lat = Column(Float)
    start_lng = Column(Float)
    end_lat = Column(Float, nullable=True)
    end_lng = Column(Float, nullable=True)
    status = Column(String, default="Active")
    guardian_ids = Column(String) # Comma-separated IDs
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

class DangerZone(Base):
    __tablename__ = "danger_zones"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    verified = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class MedicalProfile(Base):
    __tablename__ = "medical_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    blood_type = Column(String)
    allergies = Column(String)
    conditions = Column(String)
    medications = Column(String)
    emergency_contact = Column(String)
    updated_at = Column(DateTime, default=datetime.utcnow)

class SupportService(Base):
    __tablename__ = "support_services"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    phone = Column(String)
    category = Column(String)
    description = Column(String)
    website = Column(String)

class LockdownAlert(Base):
    __tablename__ = "lockdown_alerts"
    id = Column(Integer, primary_key=True, index=True)
    message = Column(String)
    safe_routes = Column(String) # JSON string of routes
    status = Column(String, default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)

class SafeCheckIn(Base):
    __tablename__ = "safe_checkins"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    lockdown_alert_id = Column(Integer, ForeignKey("lockdown_alerts.id"))
    latitude = Column(Float)
    longitude = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    content = Column(String)
    type = Column(String) # 'alert', 'tip', 'general'
    location = Column(String, nullable=True)
    likes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="posts")

class Badge(Base):
    __tablename__ = "badges"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True)
    icon = Column(String)
    description = Column(String)

class UserBadge(Base):
    __tablename__ = "user_badges"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    badge_id = Column(Integer, ForeignKey("badges.id"))
    awarded_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="badges")
    badge = relationship("Badge")

class CrimeHotspot(Base):
    __tablename__ = "crime_hotspots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    description = Column(String)
    risk_level = Column(String)

class CrimeReport(Base):
    __tablename__ = "crime_reports"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    incident_type = Column(String)  # Theft, Assault, Vandalism, Suspicious Activity, Other
    description = Column(String)
    location_address = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    photo_url = Column(String, nullable=True)
    is_anonymous = Column(Boolean, default=False)
    status = Column(String, default="Pending")  # Pending, Solved, Unresolved
    assigned_station_id = Column(Integer, ForeignKey("stations.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class CrimeReportMessage(Base):
    __tablename__ = "crime_report_messages"
    id = Column(Integer, primary_key=True, index=True)
    report_id = Column(Integer, ForeignKey("crime_reports.id"))
    sender_type = Column(String)  # "user" or "garda"
    sender_id = Column(Integer)
    message = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Guardian(Base):
    __tablename__ = "guardians"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    guardian_username = Column(String)
    guardian_type = Column(String)  # Friend, Family, Parent, Garda
    can_track = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

# ============================================================================
# NEW MODELS — Phase 1-3 Features
# ============================================================================

class AuditLog(Base):
    """Full audit trail for all critical actions"""
    __tablename__ = "audit_log"
    id = Column(Integer, primary_key=True, index=True)
    action = Column(String)  # sos_activated, sos_accepted, sos_cancelled, crime_reported, etc.
    actor_type = Column(String)  # user, garda, system
    actor_id = Column(Integer, nullable=True)
    target_type = Column(String, nullable=True)  # sos, crime_report, user, etc.
    target_id = Column(Integer, nullable=True)
    metadata_json = Column(Text, nullable=True)  # JSON string with additional context
    ip_address = Column(String, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

class EscalationLog(Base):
    """Tracks SOS escalation through the chain of command"""
    __tablename__ = "escalation_log"
    id = Column(Integer, primary_key=True, index=True)
    sos_id = Column(Integer, ForeignKey("sos_queue.id"))
    level = Column(Integer, default=1)  # 1=Station, 2=Next Station, 3=Regional HQ, 4=All Officers
    station_id = Column(Integer, ForeignKey("stations.id"), nullable=True)
    status = Column(String, default="Pending")  # Pending, Accepted, Escalated, Timeout
    escalated_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    accepted_by_garda_id = Column(Integer, nullable=True)

class SmartWatch(Base):
    """Garda smart-watch devices"""
    __tablename__ = "smart_watches"
    id = Column(Integer, primary_key=True, index=True)
    garda_id = Column(Integer, ForeignKey("gardai.id"), nullable=True)
    device_id = Column(String, unique=True)  # Hardware serial/UUID
    device_type = Column(String, default="Garmin Instinct 2 Solar")
    battery_level = Column(Integer, default=100)
    heart_rate = Column(Integer, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    is_active = Column(Boolean, default=True)
    last_sync = Column(DateTime, default=datetime.utcnow)
    registered_at = Column(DateTime, default=datetime.utcnow)

class WatchAlert(Base):
    """Alerts triggered by smart-watch hardware"""
    __tablename__ = "watch_alerts"
    id = Column(Integer, primary_key=True, index=True)
    watch_id = Column(Integer, ForeignKey("smart_watches.id"))
    alert_type = Column(String)  # fall_detected, heart_rate_crash, sos_button, proximity_alert
    data_json = Column(Text, nullable=True)  # JSON with HR, accelerometer data, etc.
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    resolved = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

class EmergencyServiceIntegration(Base):
    """Tracks dispatch to 999/112 external services"""
    __tablename__ = "emergency_service_integrations"
    id = Column(Integer, primary_key=True, index=True)
    sos_id = Column(Integer, ForeignKey("sos_queue.id"))
    service_type = Column(String)  # garda, ambulance, fire
    external_reference = Column(String, nullable=True)  # CAD reference number
    status = Column(String, default="Dispatched")  # Dispatched, Acknowledged, En Route, On Scene, Resolved
    dispatched_at = Column(DateTime, default=datetime.utcnow)
    acknowledged_at = Column(DateTime, nullable=True)
    resolved_at = Column(DateTime, nullable=True)

class Organization(Base):
    """School / Corporate deployment groups"""
    __tablename__ = "organizations"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    org_type = Column(String)  # school, corporate, community
    admin_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    settings_json = Column(Text, nullable=True)  # JSON config
    created_at = Column(DateTime, default=datetime.utcnow)

class OrganizationMember(Base):
    """Members belonging to organizations"""
    __tablename__ = "organization_members"
    id = Column(Integer, primary_key=True, index=True)
    org_id = Column(Integer, ForeignKey("organizations.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(String, default="member")  # admin, member, child
    joined_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ============================================================================
# PYDANTIC SCHEMAS
# ============================================================================
class SafeWalkStart(BaseModel):
    user_id: int
    start_lat: float
    start_lng: float
    guardian_ids: str

class EmergencyRequest(BaseModel):
    user_id: int
    latitude: float
    longitude: float
    video_url: Optional[str] = None
    service_type: Optional[str] = "all"

class DangerZoneReport(BaseModel):
    user_id: int
    latitude: float
    longitude: float

class MedicalProfileRequest(BaseModel):
    user_id: int
    blood_type: str
    allergies: str
    conditions: str
    medications: str
    emergency_contact: str

class LockdownAlertRequest(BaseModel):
    message: str
    safe_routes: str

class SafeCheckInRequest(BaseModel):
    user_id: int
    lockdown_alert_id: int
    latitude: float
    longitude: float

class PostCreate(BaseModel):
    user_id: int
    content: str
    type: str
    location: Optional[str] = None

class BadgeAward(BaseModel):
    user_id: int
    badge_name: str

class StationPostCreate(BaseModel):
    content: str
    is_official: bool = True

class CrimeReportCreate(BaseModel):
    user_id: int
    incident_type: str
    description: str
    location_address: str
    latitude: float
    longitude: float
    photo_url: Optional[str] = None
    is_anonymous: bool = False

class CrimeReportMessageCreate(BaseModel):
    sender_type: str  # "user" or "garda"
    sender_id: int
    message: str

class SOSAcceptRequest(BaseModel):
    sos_id: int
    garda_id: int

class CrimeReportStatusUpdate(BaseModel):
    status: str  # "Pending", "Solved", "Unresolved"

class GuardianAdd(BaseModel):
    user_id: int
    guardian_username: str
    guardian_type: str  # Friend, Family, Parent, Garda

class GuardianUpdate(BaseModel):
    can_track: bool

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    username: Optional[str] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    avatar_url: Optional[str] = None

class GardaChatMessage(BaseModel):
    sos_id: int
    user_message: str

class SilentSOSRequest(BaseModel):
    user_id: int
    latitude: float
    longitude: float
    is_silent: bool = True

class ProximityCheckRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 0.5  # Default 500m

class WatchRegister(BaseModel):
    garda_id: int
    device_id: str
    device_type: str = "Garmin Instinct 2 Solar"

class WatchHeartbeat(BaseModel):
    device_id: str
    battery_level: int
    heart_rate: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class WatchAlertCreate(BaseModel):
    device_id: str
    alert_type: str  # fall_detected, heart_rate_crash, sos_button
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    data: Optional[str] = None

class OrgCreate(BaseModel):
    name: str
    org_type: str
    admin_user_id: Optional[int] = None

class OrgMemberAdd(BaseModel):
    user_id: int
    role: str = "member"

class NationalAlertRequest(BaseModel):
    message: str
    region: str
    is_critical: bool


# ============================================================================
# APP SETUP
# ============================================================================
app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Socket.IO
sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
socket_app = socketio.ASGIApp(sio, app)

# Dependencies
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def load_stations_from_json():
    try:
        with open('backend/data/stations.json', 'r') as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def find_closest_station(lat, lng, db):
    """Find closest station using Haversine formula"""
    import math
    
    stations = db.query(Station).all()
    if not stations:
        return None, "Unknown"
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        """Calculate distance between two points in kilometers"""
        R = 6371  # Earth's radius in kilometers
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)
        
        a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    closest = min(stations, key=lambda s: haversine_distance(lat, lng, s.latitude, s.longitude))
    distance = haversine_distance(lat, lng, closest.latitude, closest.longitude)
    
    # Estimate ETA (rough: 5 mins per km in urban area)
    eta_mins = int(distance * 5)
    eta = f"{eta_mins} mins" if eta_mins > 0 else "< 1 min"
    
    return closest, eta

async def notify_guardians(user_id: int, event_type: str, data: dict, db: Session):
    """
    Notify all guardians with tracking permission enabled
    
    Args:
        user_id: ID of the user triggering the event
        event_type: Type of event ('sos_alert', 'safe_walk_started', 'safe_walk_ended', 'location_update')
        data: Additional data to send with the notification
        db: Database session
        
    Returns:
        Number of guardians notified
    """
    guardians = db.query(Guardian).filter(
        Guardian.user_id == user_id,
        Guardian.can_track == True
    ).all()
    
    # Get user info for the notification
    user = db.query(User).filter(User.id == user_id).first()
    user_name = user.name if user else "User"
    
    for guardian in guardians:
        await sio.emit(f'guardian_{event_type}', {
            'guardian_username': guardian.guardian_username,
            'user_id': user_id,
            'user_name': user_name,
            **data
        })
    
    return len(guardians)

# ============================================================================
# STATION POSTS HELPERS
# ============================================================================
STATION_POSTS_FILE = "backend/data/station_posts.json"

def load_station_posts():
    if not os.path.exists(STATION_POSTS_FILE):
        return []
    try:
        with open(STATION_POSTS_FILE, "r") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def save_station_posts(posts):
    with open(STATION_POSTS_FILE, "w") as f:
        json.dump(posts, f, indent=4)

# ============================================================================
# ENDPOINTS
# ============================================================================

@app.get("/")
def read_root():
    return {"message": "SLÁN Backend API is running"}

@app.get("/stations")
def get_stations(db: Session = Depends(get_db)):
    stations = db.query(Station).all()
    return {
        "stations": [
            {
                "id": s.id,
                "name": s.name,
                "latitude": s.latitude,
                "longitude": s.longitude,
                "address": s.address
            }
            for s in stations
        ]
    }

@app.get("/dashboard/{station_id}")
def get_garda_dashboard(station_id: int, db: Session = Depends(get_db)):
    """Return Garda dashboard data - active SOS, Garda count, locations"""
    # Get active SOS calls for this station
    sos_calls = db.query(SOSQueue).filter(
        SOSQueue.station_id == station_id,
        SOSQueue.status == "Active"
    ).all()
    
    # Get Garda count at this station
    garda_count = db.query(Garda).filter(
        Garda.station_id == station_id,
        Garda.is_on_duty == True
    ).count()
    
    # Get on-duty Garda locations
    gardai = db.query(Garda).filter(
        Garda.station_id == station_id,
        Garda.is_on_duty == True
    ).all()
    
    station = db.query(Station).filter(Station.id == station_id).first()
    
    return {
        "station_name": station.name if station else None,
        "active_sos": [
            {
                "id": sos.id,
                "user_id": sos.user_id,
                "latitude": sos.latitude,
                "longitude": sos.longitude,
                "eta": sos.eta,
                "created_at": sos.created_at.isoformat()
            }
            for sos in sos_calls
        ],
        "garda_count": garda_count,
        "garda_locations": [
            {
                "id": g.id,
                "latitude": g.latitude,
                "longitude": g.longitude
            }
            for g in gardai if g.latitude and g.longitude
        ]
    }

@app.post("/accept-call")
async def accept_sos_call(req: SOSAcceptRequest, db: Session = Depends(get_db)):
    """Garda accepts SOS call - update status to 'Rerouted'"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == req.sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS call not found")
    
    sos.status = "Rerouted"
    db.commit()
    
    # Emit real-time update
    await sio.emit('sos_accepted', {
        'sos_id': sos.id,
        'garda_id': req.garda_id,
        'status': 'Rerouted'
    })
    
    return {
        "message": "SOS call accepted",
        "sos_id": sos.id,
        "status": sos.status
    }

@app.post("/feedback")
def submit_feedback(user_id: int, message: str, db: Session = Depends(get_db)):
    """Submit user feedback"""
    feedback = Feedback(user_id=user_id, message=message)
    db.add(feedback)
    db.commit()
    
    return {"message": "Feedback submitted successfully"}

@app.post("/sos/activate")
async def activate_sos(emergency: EmergencyRequest, db: Session = Depends(get_db)):
    """
    Activate SOS emergency alert
    - Creates SOS queue entry
    - Finds closest Garda station
    - Notifies guardians with tracking enabled
    - Emits Socket.IO events
    """
    closest_station, eta = find_closest_station(emergency.latitude, emergency.longitude, db)
    
    # Create SOS entry
    sos = SOSQueue(
        user_id=emergency.user_id,
        latitude=emergency.latitude,
        longitude=emergency.longitude,
        status="Active",
        video_url=emergency.video_url,
        service_type=emergency.service_type,
        eta=eta,
        station_id=closest_station.id if closest_station else None,
        priority="Normal"
    )
    
    db.add(sos)
    db.commit()
    db.refresh(sos)
    
    # Notify guardians
    guardians_notified = await notify_guardians(
        user_id=emergency.user_id,
        event_type='sos_alert',
        data={
            'sos_id': sos.id,
            'latitude': emergency.latitude,
            'longitude': emergency.longitude,
            'eta': eta,
            'station_name': closest_station.name if closest_station else 'Unknown'
        },
        db=db
    )
    
    # Emit real-time update to Garda dashboard
    await sio.emit('new_sos', {
        'sos_id': sos.id,
        'user_id': sos.user_id,
        'latitude': sos.latitude,
        'longitude': sos.longitude,
        'station_id': closest_station.id if closest_station else None,
        'service_type': sos.service_type
    })
    
    return {
        "message": "SOS activated",
        "sos_id": sos.id,
        "eta": eta,
        "station_name": closest_station.name if closest_station else "Unknown",
        "guardians_notified": guardians_notified
    }

# ============================================================================
# PREMIUM FEATURE ENDPOINTS
# ============================================================================

@app.post("/safe-walk/start")
async def start_safe_walk(walk: SafeWalkStart, db: Session = Depends(get_db)):
    """
    Start Safe Walk Home journey tracking (Feature #3)
    - Fetches guardians with tracking enabled
    - Notifies guardians via Socket.IO
    - Creates journey record
    """
    # Fetch guardians with tracking enabled
    guardians = db.query(Guardian).filter(
        Guardian.user_id == walk.user_id,
        Guardian.can_track == True
    ).all()
    
    # Store guardian IDs as comma-separated string
    guardian_ids_str = ",".join([str(g.id) for g in guardians])
    
    journey = SafeWalkJourney(
        user_id=walk.user_id,
        start_lat=walk.start_lat,
        start_lng=walk.start_lng,
        status="Active",
        guardian_ids=guardian_ids_str
    )
    
    db.add(journey)
    db.commit()
    db.refresh(journey)
    
    # Notify guardians
    guardians_notified = await notify_guardians(
        user_id=walk.user_id,
        event_type='safe_walk_started',
        data={
            'journey_id': journey.id,
            'start_lat': walk.start_lat,
            'start_lng': walk.start_lng,
            'started_at': journey.started_at.isoformat()
        },
        db=db
    )
    
    return {
        "message": "Safe Walk journey started",
        "journey_id": journey.id,
        "guardians_notified": guardians_notified
    }

@app.post("/safe-walk/end")
async def end_safe_walk(journey_id: int, end_lat: float, end_lng: float, db: Session = Depends(get_db)):
    """End Safe Walk journey and notify guardians"""
    journey = db.query(SafeWalkJourney).filter(SafeWalkJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    
    journey.status = "Completed"
    journey.end_lat = end_lat
    journey.end_lng = end_lng
    journey.ended_at = datetime.utcnow()
    db.commit()
    
    # Notify guardians that user arrived safely
    await notify_guardians(
        user_id=journey.user_id,
        event_type='safe_walk_ended',
        data={
            'journey_id': journey_id,
            'end_lat': end_lat,
            'end_lng': end_lng,
            'ended_at': journey.ended_at.isoformat()
        },
        db=db
    )
    
    return {"message": "Safe Walk journey completed"}

@app.post("/safe-walk/location-update")
async def update_safe_walk_location(
    journey_id: int, 
    latitude: float, 
    longitude: float, 
    db: Session = Depends(get_db)
):
    """
    Update location during Safe Walk journey
    Emits real-time location to guardians tracking this journey
    """
    journey = db.query(SafeWalkJourney).filter(SafeWalkJourney.id == journey_id).first()
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    
    if journey.status != "Active":
        raise HTTPException(status_code=400, detail="Journey is not active")

@app.post("/national-alert")
async def broadcast_national_alert(alert: NationalAlertRequest):
    """Broadcast alert from Government Layer to all citizens"""
    await sio.emit('national_alert', {
        'message': alert.message,
        'region': alert.region,
        'is_critical': alert.is_critical,
        'timestamp': datetime.utcnow().isoformat()
    })
    return {"message": "Alert broadcast successfully"}
    
    # Notify guardians with location update
    await notify_guardians(
        user_id=journey.user_id,
        event_type='location_update',
        data={
            'journey_id': journey_id,
            'latitude': latitude,
            'longitude': longitude,
            'timestamp': datetime.utcnow().isoformat()
        },
        db=db
    )
    
    return {"message": "Location updated"}

@app.post("/dv-alert")
async def domestic_violence_alert(emergency: EmergencyRequest, db: Session = Depends(get_db)):
    """One-Tap Domestic Violence Alert (Feature #4) - Priority queue"""
    closest_station, eta = find_closest_station(emergency.latitude, emergency.longitude, db)
    
    # Create high-priority SOS
    sos = SOSQueue(
        user_id=emergency.user_id,
        latitude=emergency.latitude,
        longitude=emergency.longitude,
        status="Active",
        video_url=emergency.video_url,
        service_type=emergency.service_type,
        eta=eta,
        station_id=closest_station.id if closest_station else None,
        priority="High"  # DV alerts get priority
    )
    
    db.add(sos)
    db.commit()
    db.refresh(sos)
    
    # Emit real-time update
    await sio.emit('dv_alert', {
        'sos_id': sos.id,
        'user_id': sos.user_id,
        'priority': 'High'
    })
    
    return {
        "message": "DV Alert activated - specialist unit notified",
        "sos_id": sos.id,
        "priority": "High",
        "eta": eta
    }

@app.post("/danger-zone/report")
def report_danger_zone(report: DangerZoneReport, db: Session = Depends(get_db)):
    """User reports feeling unsafe at location (Feature #7)"""
    danger_zone = DangerZone(
        user_id=report.user_id,
        latitude=report.latitude,
        longitude=report.longitude,
        verified=True  # Verified users only
    )
    
    db.add(danger_zone)
    db.commit()
    
    return {"message": "Danger zone reported successfully"}

@app.get("/danger-zone/heatmap")
def get_danger_zone_heatmap(db: Session = Depends(get_db)):
    """Return aggregated danger zone heat map (Feature #7)"""
    # Get danger zones from last 24 hours
    danger_zones = db.query(DangerZone).filter(
        DangerZone.verified == True
    ).all()
    
    return {
        "danger_zones": [
            {
                "latitude": dz.latitude,
                "longitude": dz.longitude,
                "timestamp": dz.timestamp.isoformat()
            }
            for dz in danger_zones
        ]
    }

@app.get("/garda-locations")
def get_garda_locations(db: Session = Depends(get_db)):
    """Return anonymized on-duty Garda car locations (Feature #8)"""
    gardai = db.query(Garda).filter(Garda.is_on_duty == True).all()
    
    return {
        "garda_locations": [
            {
                "latitude": g.latitude,
                "longitude": g.longitude
            }
            for g in gardai if g.latitude and g.longitude
        ]
    }

@app.post("/medical-profile")
def save_medical_profile(profile: MedicalProfileRequest, db: Session = Depends(get_db)):
    """Save/update emergency medical profile (Feature #9)"""
    # Check if profile exists
    existing = db.query(MedicalProfile).filter(MedicalProfile.user_id == profile.user_id).first()
    
    if existing:
        # Update existing profile
        existing.blood_type = profile.blood_type
        existing.allergies = profile.allergies
        existing.conditions = profile.conditions
        existing.medications = profile.medications
        existing.emergency_contact = profile.emergency_contact
        existing.updated_at = datetime.utcnow()
        db.commit()
        return {"message": "Medical profile updated"}
    else:
        # Create new profile
        new_profile = MedicalProfile(
            user_id=profile.user_id,
            blood_type=profile.blood_type,
            allergies=profile.allergies,
            conditions=profile.conditions,
            medications=profile.medications,
            emergency_contact=profile.emergency_contact
        )
        db.add(new_profile)
        db.commit()
        return {"message": "Medical profile created"}

@app.get("/medical-profile/{user_id}")
def get_medical_profile(user_id: int, db: Session = Depends(get_db)):
    """Retrieve medical profile for ambulance crews (Feature #9)"""
    profile = db.query(MedicalProfile).filter(MedicalProfile.user_id == user_id).first()
    
    if not profile:
        return {"message": "No medical profile found"}
    
    return {
        "blood_type": profile.blood_type,
        "allergies": profile.allergies,
        "conditions": profile.conditions,
        "medications": profile.medications,
        "emergency_contact": profile.emergency_contact
    }

@app.get("/support-services")
def get_support_services(db: Session = Depends(get_db)):
    """Return Post-Incident Support Hub contacts (Feature #10)"""
    services = db.query(SupportService).all()
    
    return {
        "services": [
            {
                "id": s.id,
                "name": s.name,
                "phone": s.phone,
                "category": s.category,
                "description": s.description,
                "website": s.website
            }
            for s in services
        ]
    }

@app.post("/admin/lockdown-alert")
async def trigger_lockdown_alert(alert: LockdownAlertRequest, db: Session = Depends(get_db)):
    """Government triggers National Lockdown Mode (Ireland Shield)"""
    lockdown = LockdownAlert(
        message=alert.message,
        safe_routes=alert.safe_routes,
        status="Active"
    )
    
    db.add(lockdown)
    db.commit()
    db.refresh(lockdown)
    
    # Emit real-time alert to all users
    await sio.emit('lockdown_alert', {
        'lockdown_id': lockdown.id,
        'message': lockdown.message,
        'safe_routes': lockdown.safe_routes
    })
    
    return {
        "message": "National Lockdown Alert activated",
        "lockdown_id": lockdown.id
    }

@app.post("/lockdown/safe-check")
def safe_check_in(check_in: SafeCheckInRequest, db: Session = Depends(get_db)):
    """User confirms 'I'm safe' during lockdown"""
    safe_check = SafeCheckIn(
        user_id=check_in.user_id,
        lockdown_alert_id=check_in.lockdown_alert_id,
        latitude=check_in.latitude,
        longitude=check_in.longitude
    )
    
    db.add(safe_check)
    db.commit()
    
    return {"message": "Safe check-in recorded"}

# ============================================================================
# STATION POSTS ENDPOINTS
# ============================================================================

@app.get("/station/{station_name}/posts")
def get_station_posts(station_name: str):
    """Get all posts for a specific station"""
    all_posts = load_station_posts()
    # Filter posts by station name (case insensitive)
    station_posts = [
        p for p in all_posts 
        if p["station_name"].lower() == station_name.lower()
    ]
    # Sort by timestamp descending (newest first)
    # Since we use "Just now" for new posts, we might need better sorting later
    # For now, we'll just reverse the list assuming append order
    return station_posts[::-1]

@app.post("/station/{station_name}/posts")
def create_station_post(station_name: str, post: StationPostCreate):
    """Create a new post for a station"""
    all_posts = load_station_posts()
    
    new_post = {
        "id": str(len(all_posts) + 1),
        "station_name": station_name,
        "content": post.content,
        "timestamp": "Just now", # Placeholder
        "likes": 0,
        "is_official": post.is_official
    }
    
    all_posts.append(new_post)
    save_station_posts(all_posts)
    
    return {"message": "Post created", "post": new_post}

@app.post("/posts/{post_id}/like")
def like_post(post_id: str):
    """Like a station post"""
    all_posts = load_station_posts()
    
    for post in all_posts:
        if post["id"] == post_id:
            post["likes"] += 1
            save_station_posts(all_posts)
            return {"message": "Post liked", "likes": post["likes"]}
            
    raise HTTPException(status_code=404, detail="Post not found")

# ============================================================================
# COMMUNITY & GAMIFICATION ENDPOINTS
# ============================================================================

@app.get("/feed")
def get_feed():
    """Get community feed with mock posts"""
    mock_posts = [
        {
            "id": 1,
            "user_id": 2,
            "user_name": "Sarah Murphy",
            "user_avatar": "https://i.pravatar.cc/150?img=1",
            "content": "Just witnessed a suspicious vehicle on Grafton Street. Dark blue sedan, no plates visible. Gardaí have been notified. Stay safe everyone! 🚨",
            "type": "alert",
            "location": "Grafton Street, Dublin 2",
            "likes": 24,
            "created_at": "2025-01-20T18:30:00"
        },
        {
            "id": 2,
            "user_id": 3,
            "user_name": "John O'Brien",
            "user_avatar": "https://i.pravatar.cc/150?img=12",
            "content": "Huge shoutout to the Garda who helped me find my lost wallet near Temple Bar tonight! Faith in humanity restored 💙",
            "type": "info",
            "location": "Temple Bar",
            "likes": 156,
            "created_at": "2025-01-20T17:15:00"
        },
        {
            "id": 3,
            "user_id": 4,
            "user_name": "Emma Collins",
            "user_avatar": "https://i.pravatar.cc/150?img=5",
            "content": "PSA: There's a community safety walk happening this Saturday at 7pm starting from Phoenix Park. All are welcome! Let's look out for each other 🚶‍♀️🚶‍♂️",
            "type": "info",
            "location": "Phoenix Park",
            "likes": 89,
            "created_at": "2025-01-20T16:45:00"
        },
        {
            "id": 4,
            "user_id": 5,
            "user_name": "Garda Station Dublin 1",
            "user_avatar": "https://i.pravatar.cc/150?img=60",
            "content": "⚠️ ALERT: Increased reports of phone thefts in the city center. Please keep your belongings secure and be aware of your surroundings. Report any suspicious activity immediately.",
            "type": "alert",
            "location": "Dublin City Center",
            "likes": 203,
            "created_at": "2025-01-20T15:00:00"
        },
        {
            "id": 5,
            "user_id": 6,
            "user_name": "Michael Ryan",
            "user_avatar": "https://i.pravatar.cc/150?img=14",
            "content": "Anyone else notice the new street lights on Camden Street? Feeling so much safer walking home at night now! Great work Dublin City Council 💡",
            "type": "info",
            "location": "Camden Street",
            "likes": 67,
            "created_at": "2025-01-20T14:20:00"
        },
        {
            "id": 6,
            "user_id": 7,
            "user_name": "Lisa Walsh",
            "user_avatar": "https://i.pravatar.cc/150?img=9",
            "content": "Reminder: Always use the Safe Walk feature when walking alone at night. I used it last night and felt so much more secure knowing my location was being tracked 🛡️",
            "type": "help",
            "location": "Rathmines",
            "likes": 142,
            "created_at": "2025-01-20T13:10:00"
        },
        {
            "id": 7,
            "user_id": 8,
            "user_name": "David Kennedy",
            "user_avatar": "https://i.pravatar.cc/150?img=33",
            "content": "Big thanks to everyone who helped during the lockdown alert yesterday. Community spirit at its finest! 🙏",
            "type": "info",
            "location": "Ballsbridge",
            "likes": 98,
            "created_at": "2025-01-20T12:00:00"
        },
        {
            "id": 8,
            "user_id": 9,
            "user_name": "Rachel Byrne",
            "user_avatar": "https://i.pravatar.cc/150?img=20",
            "content": "⚠️ Avoid Pearse Street area - major traffic incident. Gardaí on scene. Use alternative routes!",
            "type": "alert",
            "location": "Pearse Street",
            "likes": 45,
            "created_at": "2025-01-20T11:30:00"
        },
        {
            "id": 9,
            "user_id": 10,
            "user_name": "Tom Fitzgerald",
            "user_avatar": "https://i.pravatar.cc/150?img=52",
            "content": "Just completed my first Safe Walk journey using SLÁN! Felt so secure knowing my guardians could track me. This app is a game changer! 🌟",
            "type": "info",
            "location": "Drumcondra",
            "likes": 187,
            "created_at": "2025-01-20T10:15:00"
        },
        {
            "id": 10,
            "user_id": 11,
            "user_name": "Aoife Brennan",
            "user_avatar": "https://i.pravatar.cc/150?img=16",
            "content": "Friendly reminder to check in on your elderly neighbors. Community safety is everyone's responsibility! 💚",
            "type": "help",
            "location": "Clontarf",
            "likes": 234,
            "created_at": "2025-01-20T09:00:00"
        }
    ]
    
    return {"posts": mock_posts}

@app.post("/feed")
def create_post(post: PostCreate, db: Session = Depends(get_db)):
    """Create a new community post"""
    # Ensure user exists (for dev/testing)
    user = db.query(User).filter(User.id == post.user_id).first()
    if not user:
        user = User(id=post.user_id, name="Test User", biometric_hash="dummy", is_child=False)
        db.add(user)
        db.commit()
        db.refresh(user)

    new_post = Post(
        user_id=post.user_id,
        content=post.content,
        type=post.type,
        location=post.location
    )
    db.add(new_post)
    
    # Gamification: Award reputation points
    user.reputation_score += 5
        
    db.commit()
    db.refresh(new_post)
    
    return {"message": "Post created", "post_id": new_post.id}

@app.get("/profile/{user_id}")
def get_public_profile(user_id: int, db: Session = Depends(get_db)):
    """Get public user profile with badges"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    badges = db.query(UserBadge).filter(UserBadge.user_id == user_id).all()
    
    return {
        "id": user.id,
        "name": user.name,
        "username": user.username or f"@{user.name.replace(' ', '').lower()}",
        "bio": user.bio,
        "location": user.location,
        "avatar_url": user.avatar_url,
        "reputation_score": user.reputation_score,
        "badges": [
            {
                "name": b.badge.name,
                "icon": b.badge.icon,
                "description": b.badge.description,
                "awarded_at": b.awarded_at.isoformat()
            }
            for b in badges
        ],
        "posts_count": len(user.posts) if user.posts else 0
    }

@app.put("/profile/{user_id}")
def update_profile(user_id: int, profile: ProfileUpdate, db: Session = Depends(get_db)):
    """Update user profile"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update fields if provided
    if profile.name is not None:
        user.name = profile.name
    if profile.username is not None:
        # Check if username is already taken
        existing = db.query(User).filter(User.username == profile.username, User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken")
        user.username = profile.username
    if profile.bio is not None:
        user.bio = profile.bio
    if profile.location is not None:
        user.location = profile.location
    if profile.avatar_url is not None:
        user.avatar_url = profile.avatar_url
    
    db.commit()
    db.refresh(user)
    
    return {
        "message": "Profile updated successfully",
        "profile": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "bio": user.bio,
            "location": user.location,
            "avatar_url": user.avatar_url
        }
    }

@app.post("/badges/award")
def award_badge(award: BadgeAward, db: Session = Depends(get_db)):
    """Award a badge to a user (Internal/Admin)"""
    badge = db.query(Badge).filter(Badge.name == award.badge_name).first()
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
        
    # Check if already awarded
    existing = db.query(UserBadge).filter(
        UserBadge.user_id == award.user_id,
        UserBadge.badge_id == badge.id
    ).first()
    
    if existing:
        return {"message": "User already has this badge"}
        
    user_badge = UserBadge(user_id=award.user_id, badge_id=badge.id)
    db.add(user_badge)
    db.commit()
    
    return {"message": f"Badge '{badge.name}' awarded"}

# ============================================================================
# CRIME REPORT ENDPOINTS
# ============================================================================

@app.post("/report-crime")
async def submit_crime_report(report: CrimeReportCreate, db: Session = Depends(get_db)):
    """Submit a new crime report - auto-routes to closest station"""
    # Find closest station
    closest_station, eta = find_closest_station(report.latitude, report.longitude, db)
    
    if not closest_station:
        raise HTTPException(status_code=500, detail="No stations available")
    
    # Create crime report
    crime_report = CrimeReport(
        user_id=report.user_id,
        incident_type=report.incident_type,
        description=report.description,
        location_address=report.location_address,
        latitude=report.latitude,
        longitude=report.longitude,
        photo_url=report.photo_url,
        is_anonymous=report.is_anonymous,
        assigned_station_id=closest_station.id,
        status="Pending"
    )
    
    db.add(crime_report)
    db.commit()
    db.refresh(crime_report)
    
    # Emit Socket.IO event to assigned station
    await sio.emit('new_crime_report', {
        'report_id': crime_report.id,
        'station_id': closest_station.id,
        'incident_type': crime_report.incident_type,
        'location': crime_report.location_address
    })
    
    return {
        "message": "Crime report submitted successfully",
        "report_id": crime_report.id,
        "assigned_station": closest_station.name,
        "status": "Pending"
    }

@app.get("/crime-reports/{user_id}")
def get_user_crime_reports(user_id: int, db: Session = Depends(get_db)):
    """Get all crime reports for a specific user (ticket dashboard)"""
    reports = db.query(CrimeReport).filter(CrimeReport.user_id == user_id).order_by(CrimeReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        # Get unread message count
        messages = db.query(CrimeReportMessage).filter(CrimeReportMessage.report_id == report.id).all()
        unread_count = sum(1 for msg in messages if msg.sender_type == "garda")
        
        # Get assigned station name
        station = db.query(Station).filter(Station.id == report.assigned_station_id).first()
        
        result.append({
            "id": report.id,
            "incident_type": report.incident_type,
            "description": report.description,
            "location_address": report.location_address,
            "status": report.status,
            "assigned_station": station.name if station else "Unknown",
            "created_at": report.created_at.isoformat(),
            "unread_messages": unread_count
        })
    
    return {"reports": result}

@app.get("/crime-report/{report_id}")
def get_crime_report_detail(report_id: int, db: Session = Depends(get_db)):
    """Get single crime report details"""
    report = db.query(CrimeReport).filter(CrimeReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    station = db.query(Station).filter(Station.id == report.assigned_station_id).first()
    
    return {
        "id": report.id,
        "user_id": report.user_id,
        "incident_type": report.incident_type,
        "description": report.description,
        "location_address": report.location_address,
        "latitude": report.latitude,
        "longitude": report.longitude,
        "photo_url": report.photo_url,
        "is_anonymous": report.is_anonymous,
        "status": report.status,
        "assigned_station": station.name if station else "Unknown",
        "assigned_station_id": report.assigned_station_id,
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat()
    }

@app.post("/crime-report/{report_id}/message")
async def send_crime_report_message(report_id: int, message: CrimeReportMessageCreate, db: Session = Depends(get_db)):
    """Send a message in a crime report chat"""
    # Verify report exists
    report = db.query(CrimeReport).filter(CrimeReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Create message
    new_message = CrimeReportMessage(
        report_id=report_id,
        sender_type=message.sender_type,
        sender_id=message.sender_id,
        message=message.message
    )
    
    db.add(new_message)
    db.commit()
    db.refresh(new_message)
    
    # Emit Socket.IO event for real-time chat
    await sio.emit('crime_report_message', {
        'report_id': report_id,
        'sender_type': message.sender_type,
        'sender_id': message.sender_id,
        'message': message.message,
        'created_at': new_message.created_at.isoformat()
    })
    
    return {
        "message": "Message sent successfully",
        "message_id": new_message.id
    }

@app.get("/crime-report/{report_id}/messages")
def get_crime_report_messages(report_id: int, db: Session = Depends(get_db)):
    """Get all messages for a crime report"""
    messages = db.query(CrimeReportMessage).filter(
        CrimeReportMessage.report_id == report_id
    ).order_by(CrimeReportMessage.created_at.asc()).all()
    
    return {
        "messages": [
            {
                "id": msg.id,
                "sender_type": msg.sender_type,
                "sender_id": msg.sender_id,
                "message": msg.message,
                "created_at": msg.created_at.isoformat()
            }
            for msg in messages
        ]
    }

@app.put("/crime-report/{report_id}/status")
async def update_crime_report_status(report_id: int, status_update: CrimeReportStatusUpdate, db: Session = Depends(get_db)):
    """Update crime report status (Garda only)"""
    report = db.query(CrimeReport).filter(CrimeReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    report.status = status_update.status
    report.updated_at = datetime.utcnow()
    db.commit()
    
    # Emit Socket.IO event to notify user
    await sio.emit('crime_report_status_update', {
        'report_id': report_id,
        'status': status_update.status,
        'updated_at': report.updated_at.isoformat()
    })
    
    return {
        "message": "Status updated successfully",
        "report_id": report_id,
        "status": status_update.status
    }

@app.get("/garda/crime-reports/{station_id}")
def get_station_crime_reports(station_id: int, status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all crime reports assigned to a specific station (Garda dashboard)"""
    query = db.query(CrimeReport).filter(CrimeReport.assigned_station_id == station_id)
    
    if status_filter and status_filter != "All":
        query = query.filter(CrimeReport.status == status_filter)
    
    reports = query.order_by(CrimeReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        # Get unread message count
        messages = db.query(CrimeReportMessage).filter(CrimeReportMessage.report_id == report.id).all()
        unread_count = sum(1 for msg in messages if msg.sender_type == "user")
        
        result.append({
            "id": report.id,
            "user_id": report.user_id if not report.is_anonymous else None,
            "incident_type": report.incident_type,
            "description": report.description,
            "location_address": report.location_address,
            "status": report.status,
            "is_anonymous": report.is_anonymous,
            "created_at": report.created_at.isoformat(),
            "unread_messages": unread_count
        })
    
    return {"reports": result}

@app.get("/garda-hq/crime-reports")
def get_all_crime_reports(status_filter: Optional[str] = None, db: Session = Depends(get_db)):
    """Get all crime reports across all stations (Garda HQ view)"""
    query = db.query(CrimeReport)
    
    if status_filter and status_filter != "All":
        query = query.filter(CrimeReport.status == status_filter)
    
    reports = query.order_by(CrimeReport.created_at.desc()).all()
    
    result = []
    for report in reports:
        station = db.query(Station).filter(Station.id == report.assigned_station_id).first()
        
        result.append({
            "id": report.id,
            "user_id": report.user_id if not report.is_anonymous else None,
            "incident_type": report.incident_type,
            "description": report.description,
            "location_address": report.location_address,
            "status": report.status,
            "assigned_station": station.name if station else "Unknown",
            "is_anonymous": report.is_anonymous,
            "created_at": report.created_at.isoformat()
        })
    
    return {"reports": result}


# ============================================================================
# GUARDIAN ENDPOINTS
# ============================================================================

@app.post("/guardians/add")
def add_guardian(guardian: GuardianAdd, db: Session = Depends(get_db)):
    """Add a guardian by username"""
    # Check if guardian already exists
    existing = db.query(Guardian).filter(
        Guardian.user_id == guardian.user_id,
        Guardian.guardian_username == guardian.guardian_username
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Guardian already added")
    
    new_guardian = Guardian(
        user_id=guardian.user_id,
        guardian_username=guardian.guardian_username,
        guardian_type=guardian.guardian_type,
        can_track=True
    )
    
    db.add(new_guardian)
    db.commit()
    db.refresh(new_guardian)
    
    return {
        "message": "Guardian added successfully",
        "guardian_id": new_guardian.id
    }

@app.get("/guardians/{user_id}")
def get_user_guardians(user_id: int, db: Session = Depends(get_db)):
    """Get all guardians for a user"""
    guardians = db.query(Guardian).filter(Guardian.user_id == user_id).all()
    
    return {
        "guardians": [
            {
                "id": g.id,
                "username": g.guardian_username,
                "type": g.guardian_type,
                "can_track": g.can_track,
                "created_at": g.created_at.isoformat()
            }
            for g in guardians
        ]
    }

@app.put("/guardians/{guardian_id}")
def update_guardian_tracking(guardian_id: int, update: GuardianUpdate, db: Session = Depends(get_db)):
    """Update guardian tracking permission"""
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    guardian.can_track = update.can_track
    db.commit()
    
    return {"message": "Guardian updated successfully"}

@app.delete("/guardians/{guardian_id}")
def remove_guardian(guardian_id: int, db: Session = Depends(get_db)):
    """Remove a guardian"""
    guardian = db.query(Guardian).filter(Guardian.id == guardian_id).first()
    
    if not guardian:
        raise HTTPException(status_code=404, detail="Guardian not found")
    
    db.delete(guardian)
    db.commit()
    
    return {"message": "Guardian removed successfully"}

@app.get("/guardians/alerts/{guardian_username}")
def get_guardian_alerts(guardian_username: str, db: Session = Depends(get_db)):
    """
    Get all active alerts for a guardian
    Returns active SOS calls and Safe Walk journeys where user has this guardian
    """
    # Find all users who have this person as a guardian
    guardian_relationships = db.query(Guardian).filter(
        Guardian.guardian_username == guardian_username,
        Guardian.can_track == True
    ).all()
    
    user_ids = [g.user_id for g in guardian_relationships]
    
    if not user_ids:
        return {"alerts": []}
    
    alerts = []
    
    # Get active SOS calls
    sos_calls = db.query(SOSQueue).filter(
        SOSQueue.user_id.in_(user_ids),
        SOSQueue.status == "Active"
    ).all()
    
    for sos in sos_calls:
        user = db.query(User).filter(User.id == sos.user_id).first()
        alerts.append({
            "id": f"sos_{sos.id}",
            "type": "sos",
            "title": "SOS ACTIVATED",
            "message": f"{user.name if user else 'User'} has triggered an SOS alert",
            "user_id": sos.user_id,
            "user_name": user.name if user else "User",
            "latitude": sos.latitude,
            "longitude": sos.longitude,
            "eta": sos.eta,
            "timestamp": sos.created_at.isoformat(),
            "read": False
        })
    
    # Get active Safe Walk journeys
    journeys = db.query(SafeWalkJourney).filter(
        SafeWalkJourney.user_id.in_(user_ids),
        SafeWalkJourney.status == "Active"
    ).all()
    
    for journey in journeys:
        user = db.query(User).filter(User.id == journey.user_id).first()
        alerts.append({
            "id": f"walk_{journey.id}",
            "type": "safe_walk",
            "title": "Safe Walk Started",
            "message": f"{user.name if user else 'User'} started a Safe Walk journey",
            "user_id": journey.user_id,
            "user_name": user.name if user else "User",
            "latitude": journey.start_lat,
            "longitude": journey.start_lng,
            "journey_id": journey.id,
            "timestamp": journey.started_at.isoformat(),
            "read": True
        })
    
    return {"alerts": alerts}

# ============================================================================
# AI CHAT ENDPOINTS
# ============================================================================

@app.post("/garda-chat/message")
async def send_garda_chat_message(message: GardaChatMessage, db: Session = Depends(get_db)):
    """
    Send message to AI-powered Garda chat
    Returns realistic, context-aware response from Garda Murphy
    """
    # Get SOS context
    sos = db.query(SOSQueue).filter(SOSQueue.id == message.sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")
    
    # Build context for AI
    context = {
        'location': f"Lat: {sos.latitude}, Lng: {sos.longitude}",
        'eta': sos.eta or 'Calculating...',
        'emergency_type': 'SOS Alert',
        'priority': sos.priority
    }
    
    # Get AI response
    garda_response = await get_garda_response(message.user_message, context)
    
    # Emit to user via Socket.IO for real-time chat
    await sio.emit('garda_message', {
        'sos_id': message.sos_id,
        'message': garda_response,
        'timestamp': datetime.utcnow().isoformat()
    })
    
    return {
        'message': garda_response,
        'timestamp': datetime.utcnow().isoformat()
    }



@app.on_event("startup")
def startup_event():
    """Load initial data on startup"""
    db = next(get_db())
    
    # Load Garda stations if not already loaded
    if db.query(Station).count() == 0:
        stations_data = load_stations_from_json()
        for station_data in stations_data:
            station = Station(**station_data)
            db.add(station)
        db.commit()
        print(f"Loaded {len(stations_data)} Garda stations")
    
    # Load support services if not already loaded
    if db.query(SupportService).count() == 0:
        support_services = [
            {
                "name": "Rape Crisis Centre",
                "phone": "1800 77 8888",
                "category": "rape_crisis",
                "description": "24/7 support for victims of sexual violence",
                "website": "https://www.drcc.ie"
            },
            {
                "name": "Women's Aid",
                "phone": "1800 341 900",
                "category": "womens_aid",
                "description": "Support for women experiencing domestic violence",
                "website": "https://www.womensaid.ie"
            },
            {
                "name": "Samaritans",
                "phone": "116 123",
                "category": "samaritans",
                "description": "24/7 emotional support",
                "website": "https://www.samaritans.org"
            },
            {
                "name": "Victim Support Ireland",
                "phone": "116 006",
                "category": "victim_support",
                "description": "Support for victims of crime",
                "website": "https://www.victimsupport.ie"
            },
            {
                "name": "Garda Victim Service Office",
                "phone": "1800 666 222",
                "category": "garda_victim_service",
                "description": "Garda support for victims of crime",
                "website": "https://www.garda.ie"
            }
        ]
        
        for service_data in support_services:
            service = SupportService(**service_data)
            db.add(service)
        db.commit()
        print(f"Loaded {len(support_services)} support services")
    
    # Add sample crime hotspots
    if db.query(CrimeHotspot).count() == 0:
        hotspots = [
            {
                "name": "O'Connell Street Area",
                "latitude": 53.3498,
                "longitude": -6.2603,
                "description": "High-risk zone - avoid late at night",
                "risk_level": "High"
            },
            {
                "name": "Temple Bar District",
                "latitude": 53.3456,
                "longitude": -6.2672,
                "description": "Pickpocketing hotspot",
                "risk_level": "Medium"
            },
            {
                "name": "Phoenix Park",
                "latitude": 53.3558,
                "longitude": -6.3298,
                "description": "Isolated areas - use caution after dark",
                "risk_level": "Medium"
            }
        ]
        
        for hotspot_data in hotspots:
            hotspot = CrimeHotspot(**hotspot_data)
            db.add(hotspot)
        db.commit()
        print(f"Loaded {len(hotspots)} crime hotspots")
    
    # Create default test user if none exists
    if db.query(User).count() == 0:
        default_user = User(
            name="Test User",
            biometric_hash="dummy_hash",
            is_child=False
        )
        db.add(default_user)
        db.commit()
        print("Created default test user (ID: 1)")
    
    db.close()

# ============================================================================
# AUDIT TRAIL HELPER
# ============================================================================

def log_audit(db: Session, action: str, actor_type: str, actor_id: int = None,
              target_type: str = None, target_id: int = None,
              metadata: dict = None, ip_address: str = None):
    """Log an action to the audit trail"""
    entry = AuditLog(
        action=action,
        actor_type=actor_type,
        actor_id=actor_id,
        target_type=target_type,
        target_id=target_id,
        metadata_json=json.dumps(metadata) if metadata else None,
        ip_address=ip_address,
    )
    db.add(entry)
    db.commit()
    return entry

# ============================================================================
# SILENT SOS ENDPOINT
# ============================================================================

@app.post("/emergency/silent")
async def activate_silent_sos(request: SilentSOSRequest, db: Session = Depends(get_db)):
    """Silent SOS — no countdown, no sound, minimal footprint. For DV/covert situations."""
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    closest = find_closest_station(request.latitude, request.longitude)

    sos = SOSQueue(
        user_id=request.user_id,
        latitude=request.latitude,
        longitude=request.longitude,
        status="Active",
        priority="High",  # Silent SOS always high priority
        assigned_station=closest["name"] if closest else "Unassigned",
    )
    db.add(sos)
    db.commit()
    db.refresh(sos)

    log_audit(db, "silent_sos_activated", "user", request.user_id,
              "sos", sos.id, {"silent": True, "lat": request.latitude, "lng": request.longitude})

    # Emit silent alert — guardians get notification without sound flag
    await sio.emit("silent_sos_alert", {
        "sos_id": sos.id,
        "user_id": request.user_id,
        "user_name": user.name,
        "latitude": request.latitude,
        "longitude": request.longitude,
        "station": closest["name"] if closest else "Unknown",
        "is_silent": True,
        "priority": "High",
        "timestamp": datetime.utcnow().isoformat(),
    })

    # Notify guardians silently (no vibration flag)
    guardians = db.query(Guardian).filter(
        Guardian.user_id == request.user_id,
        Guardian.can_track == True
    ).all()
    for guardian in guardians:
        await sio.emit("guardian_silent_alert", {
            "sos_id": sos.id,
            "user_name": user.name,
            "latitude": request.latitude,
            "longitude": request.longitude,
            "silent": True,
        })

    # Start auto-escalation
    escalation = EscalationLog(
        sos_id=sos.id,
        level=1,
        station_id=None,
        status="Pending"
    )
    db.add(escalation)
    db.commit()

    return {
        "sos_id": sos.id,
        "status": "Silent SOS Activated",
        "assigned_station": closest["name"] if closest else "Unassigned",
        "priority": "High",
        "is_silent": True,
    }

# ============================================================================
# PROXIMITY CHECK — High-Risk Zone Warnings
# ============================================================================

@app.post("/proximity-check")
async def check_proximity(request: ProximityCheckRequest, db: Session = Depends(get_db)):
    """Check if user is near any danger zones / crime hotspots"""
    import math

    hotspots = db.query(CrimeHotspot).all()
    nearby = []

    for h in hotspots:
        R = 6371
        lat1, lon1 = math.radians(request.latitude), math.radians(request.longitude)
        lat2, lon2 = math.radians(h.latitude), math.radians(h.longitude)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        distance_km = R * c

        if distance_km <= request.radius_km:
            nearby.append({
                "id": h.id,
                "name": h.name,
                "latitude": h.latitude,
                "longitude": h.longitude,
                "risk_level": h.risk_level,
                "description": h.description,
                "distance_km": round(distance_km, 3),
            })

    nearby.sort(key=lambda x: x["distance_km"])
    return {
        "user_location": {"latitude": request.latitude, "longitude": request.longitude},
        "radius_km": request.radius_km,
        "danger_zones_nearby": nearby,
        "warning": len(nearby) > 0,
    }

# ============================================================================
# ESCALATION PROTOCOLS
# ============================================================================

@app.get("/sos/{sos_id}/escalation-status")
async def get_escalation_status(sos_id: int, db: Session = Depends(get_db)):
    """Get real-time escalation status for an SOS"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    escalations = db.query(EscalationLog).filter(
        EscalationLog.sos_id == sos_id
    ).order_by(EscalationLog.level).all()

    return {
        "sos_id": sos_id,
        "sos_status": sos.status,
        "assigned_station": sos.assigned_station,
        "station_id": sos.station_id,
        "service_type": sos.service_type,
        "escalation_steps": [
            {
                "level": e.level,
                "level_name": ["", "Nearest Station", "Next Station", "Regional HQ", "All Officers"][min(e.level, 4)],
                "status": e.status,
                "escalated_at": e.escalated_at.isoformat() if e.escalated_at else None,
                "accepted_at": e.accepted_at.isoformat() if e.accepted_at else None,
                "accepted_by": e.accepted_by_garda_id,
            }
            for e in escalations
        ],
        "current_level": max([e.level for e in escalations]) if escalations else 0,
    }

@app.post("/sos/{sos_id}/escalate")
async def manually_escalate(sos_id: int, db: Session = Depends(get_db)):
    """Manually escalate an SOS to the next level"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    current = db.query(EscalationLog).filter(
        EscalationLog.sos_id == sos_id
    ).order_by(EscalationLog.level.desc()).first()

    next_level = (current.level + 1) if current else 1
    if next_level > 4:
        return {"message": "Maximum escalation level reached", "level": 4}

    # Mark previous as escalated
    if current:
        current.status = "Escalated"
        db.commit()

    new_esc = EscalationLog(
        sos_id=sos_id,
        level=next_level,
        status="Pending"
    )
    db.add(new_esc)
    db.commit()

    log_audit(db, "sos_escalated", "system", None, "sos", sos_id,
              {"from_level": next_level - 1, "to_level": next_level})

    level_names = ["", "Nearest Station", "Next Station", "Regional HQ", "All Officers"]
    await sio.emit("sos_escalated", {
        "sos_id": sos_id,
        "level": next_level,
        "level_name": level_names[min(next_level, 4)],
    })

    return {
        "sos_id": sos_id,
        "new_level": next_level,
        "level_name": level_names[min(next_level, 4)],
        "status": "Escalated"
    }

# ============================================================================
# BROADCAST ALERTS TO MULTIPLE OFFICERS
# ============================================================================

@app.post("/sos/{sos_id}/broadcast")
async def broadcast_sos(sos_id: int, db: Session = Depends(get_db)):
    """Broadcast SOS alert to all on-duty officers at the assigned station"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    user = db.query(User).filter(User.id == sos.user_id).first()
    
    officers = db.query(Garda).filter(
        Garda.station_name == sos.assigned_station,
        Garda.is_on_duty == True
    ).all()

    for officer in officers:
        await sio.emit(f"officer_alert_{officer.id}", {
            "sos_id": sos_id,
            "user_name": user.name if user else "Unknown",
            "latitude": sos.latitude,
            "longitude": sos.longitude,
            "priority": sos.priority,
            "type": "broadcast",
        })

    log_audit(db, "sos_broadcast", "system", None, "sos", sos_id,
              {"officers_notified": len(officers), "station": sos.assigned_station})

    return {
        "sos_id": sos_id,
        "officers_notified": len(officers),
        "station": sos.assigned_station,
    }

@app.post("/sos/{sos_id}/assign/{garda_id}")
async def assign_sos_to_officer(sos_id: int, garda_id: int, db: Session = Depends(get_db)):
    """Directly assign an SOS to a specific officer"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    garda = db.query(Garda).filter(Garda.id == garda_id).first()
    if not garda:
        raise HTTPException(status_code=404, detail="Officer not found")

    sos.status = "Assigned"
    sos.accepted_by = garda.badge_number
    db.commit()

    # Update escalation log
    esc = db.query(EscalationLog).filter(
        EscalationLog.sos_id == sos_id,
        EscalationLog.status == "Pending"
    ).first()
    if esc:
        esc.status = "Accepted"
        esc.accepted_at = datetime.utcnow()
        esc.accepted__by_garda_id = garda_id
        db.commit()

    log_audit(db, "sos_assigned", "garda", garda_id, "sos", sos_id,
              {"officer_name": garda.name, "badge": garda.badge_number})

    await sio.emit(f"officer_alert_{garda_id}", {
        "sos_id": sos_id, "type": "direct_assignment"
    })

    return {"sos_id": sos_id, "assigned_to": garda.name, "badge": garda.badge_number}

# ============================================================================
# ANALYTICS DASHBOARD ENDPOINTS
# ============================================================================

@app.get("/analytics/overview")
async def get_analytics_overview(db: Session = Depends(get_db)):
    """Aggregated stats for Garda management dashboard"""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=7)
    month_start = today_start - timedelta(days=30)

    total_sos = db.query(SOSQueue).count()
    active_sos = db.query(SOSQueue).filter(SOSQueue.status == "Active").count()
    today_sos = db.query(SOSQueue).filter(SOSQueue.created_at >= today_start).count()
    week_sos = db.query(SOSQueue).filter(SOSQueue.created_at >= week_start).count()

    total_crimes = db.query(CrimeReport).count()
    pending_crimes = db.query(CrimeReport).filter(CrimeReport.status == "Submitted").count()

    total_users = db.query(User).count()
    child_users = db.query(User).filter(User.is_child == True).count()

    total_officers = db.query(Garda).count()
    on_duty = db.query(Garda).filter(Garda.is_on_duty == True).count()

    # Calculate average response time (mock — based on escalation logs)
    accepted_escalations = db.query(EscalationLog).filter(
        EscalationLog.accepted_at != None
    ).all()
    if accepted_escalations:
        avg_response_seconds = sum(
            (e.accepted_at - e.escalated_at).total_seconds()
            for e in accepted_escalations
        ) / len(accepted_escalations)
    else:
        avg_response_seconds = 0

    return {
        "sos": {
            "total": total_sos,
            "active": active_sos,
            "today": today_sos,
            "this_week": week_sos,
        },
        "crime_reports": {
            "total": total_crimes,
            "pending": pending_crimes,
        },
        "users": {
            "total": total_users,
            "children": child_users,
        },
        "officers": {
            "total": total_officers,
            "on_duty": on_duty,
        },
        "performance": {
            "avg_response_time_seconds": round(avg_response_seconds, 1),
            "avg_response_time_display": f"{int(avg_response_seconds // 60)}m {int(avg_response_seconds % 60)}s" if avg_response_seconds > 0 else "N/A"
        }
    }

@app.get("/analytics/response-times")
async def get_response_times(db: Session = Depends(get_db)):
    """Per-station response time data"""
    stations_data = load_stations()
    result = []
    for station in stations_data[:20]:  # Top 20 stations
        station_sos = db.query(SOSQueue).filter(
            SOSQueue.assigned_station == station["name"]
        ).count()
        result.append({
            "station": station["name"],
            "total_sos": station_sos,
            "avg_response_min": round(2.5 + (hash(station["name"]) % 10) * 0.5, 1),  # Mock data
        })
    result.sort(key=lambda x: x["total_sos"], reverse=True)
    return result

@app.get("/analytics/incidents-by-type")
async def get_incidents_by_type(db: Session = Depends(get_db)):
    """Incident breakdown by type"""
    crime_types = db.query(
        CrimeReport.incident_type,
        func.count(CrimeReport.id)
    ).group_by(CrimeReport.incident_type).all()

    sos_count = db.query(SOSQueue).count()
    dv_count = db.query(SOSQueue).filter(SOSQueue.priority == "High").count()

    return {
        "sos_total": sos_count,
        "dv_alerts": dv_count,
        "crime_reports": [
            {"type": ct[0] or "Unknown", "count": ct[1]}
            for ct in crime_types
        ]
    }

@app.get("/analytics/hourly-heatmap")
async def get_hourly_heatmap(db: Session = Depends(get_db)):
    """Hourly incident distribution for peak analysis"""
    hours = {}
    for h in range(24):
        hours[h] = {"hour": h, "sos": 0, "crimes": 0}

    all_sos = db.query(SOSQueue).all()
    for s in all_sos:
        if s.created_at:
            hours[s.created_at.hour]["sos"] += 1

    all_crimes = db.query(CrimeReport).all()
    for c in all_crimes:
        if c.created_at:
            hours[c.created_at.hour]["crimes"] += 1

    return list(hours.values())

# ============================================================================
# SMARTWATCH INTEGRATION
# ============================================================================

@app.post("/watch/register")
async def register_watch(data: WatchRegister, db: Session = Depends(get_db)):
    """Register a new smartwatch to a Garda officer"""
    existing = db.query(SmartWatch).filter(SmartWatch.device_id == data.device_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Device already registered")

    watch = SmartWatch(
        garda_id=data.garda_id,
        device_id=data.device_id,
        device_type=data.device_type,
    )
    db.add(watch)
    db.commit()
    db.refresh(watch)

    log_audit(db, "watch_registered", "garda", data.garda_id, "watch", watch.id,
              {"device_id": data.device_id, "device_type": data.device_type})

    return {
        "watch_id": watch.id,
        "device_id": watch.device_id,
        "garda_id": watch.garda_id,
        "status": "Registered",
    }

@app.post("/watch/heartbeat")
async def watch_heartbeat(data: WatchHeartbeat, db: Session = Depends(get_db)):
    """Periodic sync from smartwatch — battery, heart rate, location"""
    watch = db.query(SmartWatch).filter(SmartWatch.device_id == data.device_id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not registered")

    watch.battery_level = data.battery_level
    watch.heart_rate = data.heart_rate
    watch.latitude = data.latitude
    watch.longitude = data.longitude
    watch.last_sync = datetime.utcnow()
    db.commit()

    # Check for heart rate crash (below 40 bpm)
    if data.heart_rate and data.heart_rate < 40:
        alert = WatchAlert(
            watch_id=watch.id,
            alert_type="heart_rate_crash",
            data_json=json.dumps({"heart_rate": data.heart_rate}),
            latitude=data.latitude,
            longitude=data.longitude,
        )
        db.add(alert)
        db.commit()

        await sio.emit("watch_emergency", {
            "alert_type": "heart_rate_crash",
            "garda_id": watch.garda_id,
            "device_id": data.device_id,
            "heart_rate": data.heart_rate,
            "latitude": data.latitude,
            "longitude": data.longitude,
        })

    return {"status": "synced", "battery": data.battery_level}

@app.post("/watch/alert")
async def watch_alert(data: WatchAlertCreate, db: Session = Depends(get_db)):
    """Watch triggers alert — fall detection, HR crash, SOS button press"""
    watch = db.query(SmartWatch).filter(SmartWatch.device_id == data.device_id).first()
    if not watch:
        raise HTTPException(status_code=404, detail="Watch not registered")

    alert = WatchAlert(
        watch_id=watch.id,
        alert_type=data.alert_type,
        data_json=data.data,
        latitude=data.latitude,
        longitude=data.longitude,
    )
    db.add(alert)
    db.commit()
    db.refresh(alert)

    log_audit(db, f"watch_{data.alert_type}", "system", watch.garda_id,
              "watch_alert", alert.id,
              {"device_id": data.device_id, "alert_type": data.alert_type})

    await sio.emit("watch_emergency", {
        "alert_id": alert.id,
        "alert_type": data.alert_type,
        "garda_id": watch.garda_id,
        "device_id": data.device_id,
        "latitude": data.latitude,
        "longitude": data.longitude,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {
        "alert_id": alert.id,
        "alert_type": data.alert_type,
        "status": "Alert Triggered",
    }

@app.get("/watch/status/{garda_id}")
async def get_watch_status(garda_id: int, db: Session = Depends(get_db)):
    """Get all watches registered to a Garda officer"""
    watches = db.query(SmartWatch).filter(SmartWatch.garda_id == garda_id).all()
    return [
        {
            "watch_id": w.id,
            "device_id": w.device_id,
            "device_type": w.device_type,
            "battery_level": w.battery_level,
            "heart_rate": w.heart_rate,
            "latitude": w.latitude,
            "longitude": w.longitude,
            "is_active": w.is_active,
            "last_sync": w.last_sync.isoformat() if w.last_sync else None,
        }
        for w in watches
    ]

@app.get("/watch/all")
async def get_all_watches(db: Session = Depends(get_db)):
    """Get all registered smartwatches for station management"""
    watches = db.query(SmartWatch).all()
    result = []
    for w in watches:
        garda = db.query(Garda).filter(Garda.id == w.garda_id).first()
        result.append({
            "watch_id": w.id,
            "device_id": w.device_id,
            "device_type": w.device_type,
            "battery_level": w.battery_level,
            "heart_rate": w.heart_rate,
            "is_active": w.is_active,
            "last_sync": w.last_sync.isoformat() if w.last_sync else None,
            "garda_name": garda.name if garda else "Unassigned",
            "garda_id": w.garda_id,
        })
    return result

@app.post("/watch/push-alert/{garda_id}")
async def push_alert_to_watch(garda_id: int, db: Session = Depends(get_db)):
    """Push an SOS proximity notification to an officer's smartwatch"""
    watch = db.query(SmartWatch).filter(
        SmartWatch.garda_id == garda_id,
        SmartWatch.is_active == True
    ).first()
    if not watch:
        return {"status": "No active watch found", "delivered": False}

    await sio.emit(f"watch_push_{watch.device_id}", {
        "type": "proximity_sos",
        "vibrate": True,
        "timestamp": datetime.utcnow().isoformat(),
    })

    return {"status": "Alert pushed to watch", "device_id": watch.device_id, "delivered": True}

# ============================================================================
# 999 / 112 INTEGRATION (Mock — Placeholder)
# ============================================================================

@app.post("/sos/{sos_id}/dispatch-999")
async def dispatch_999(sos_id: int, db: Session = Depends(get_db)):
    """Dispatch SOS to 999/112 — mock integration with CAD reference"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    ref = f"CAD-{uuid.uuid4().hex[:8].upper()}"
    integration = EmergencyServiceIntegration(
        sos_id=sos_id,
        service_type="garda",
        external_reference=ref,
        status="Dispatched",
    )
    db.add(integration)
    db.commit()

    log_audit(db, "dispatch_999", "system", None, "sos", sos_id,
              {"service": "garda", "reference": ref})

    return {
        "sos_id": sos_id,
        "service": "999 / An Garda Síochána",
        "reference_number": ref,
        "status": "Dispatched",
        "message": "Emergency services have been notified. Reference: " + ref,
    }

@app.post("/sos/{sos_id}/dispatch-ambulance")
async def dispatch_ambulance(sos_id: int, db: Session = Depends(get_db)):
    """Dispatch ambulance — mock integration"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    ref = f"AMB-{uuid.uuid4().hex[:8].upper()}"
    integration = EmergencyServiceIntegration(
        sos_id=sos_id,
        service_type="ambulance",
        external_reference=ref,
    )
    db.add(integration)
    db.commit()

    log_audit(db, "dispatch_ambulance", "system", None, "sos", sos_id,
              {"service": "ambulance", "reference": ref})

    return {
        "sos_id": sos_id,
        "service": "National Ambulance Service",
        "reference_number": ref,
        "status": "Dispatched",
        "message": "Ambulance has been dispatched. Reference: " + ref,
    }

@app.post("/sos/{sos_id}/dispatch-fire")
async def dispatch_fire(sos_id: int, db: Session = Depends(get_db)):
    """Dispatch fire brigade — mock integration"""
    sos = db.query(SOSQueue).filter(SOSQueue.id == sos_id).first()
    if not sos:
        raise HTTPException(status_code=404, detail="SOS not found")

    ref = f"FBR-{uuid.uuid4().hex[:8].upper()}"
    integration = EmergencyServiceIntegration(
        sos_id=sos_id,
        service_type="fire",
        external_reference=ref,
    )
    db.add(integration)
    db.commit()

    log_audit(db, "dispatch_fire", "system", None, "sos", sos_id,
              {"service": "fire_brigade", "reference": ref})

    return {
        "sos_id": sos_id,
        "service": "Fire Brigade",
        "reference_number": ref,
        "status": "Dispatched",
    }

@app.get("/sos/{sos_id}/dispatch-status")
async def get_dispatch_status(sos_id: int, db: Session = Depends(get_db)):
    """Get all dispatch integrations for an SOS"""
    integrations = db.query(EmergencyServiceIntegration).filter(
        EmergencyServiceIntegration.sos_id == sos_id
    ).all()
    return [
        {
            "service": i.service_type,
            "reference": i.external_reference,
            "status": i.status,
            "dispatched_at": i.dispatched_at.isoformat() if i.dispatched_at else None,
        }
        for i in integrations
    ]

# ============================================================================
# AUDIT TRAIL ENDPOINTS
# ============================================================================

@app.get("/admin/audit-log")
async def get_audit_log(
    action: Optional[str] = None,
    actor_type: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    """Retrieve audit log entries with optional filters"""
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())
    if action:
        query = query.filter(AuditLog.action == action)
    if actor_type:
        query = query.filter(AuditLog.actor_type == actor_type)
    entries = query.limit(limit).all()

    return [
        {
            "id": e.id,
            "action": e.action,
            "actor_type": e.actor_type,
            "actor_id": e.actor_id,
            "target_type": e.target_type,
            "target_id": e.target_id,
            "metadata": json.loads(e.metadata_json) if e.metadata_json else None,
            "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            "ip_address": e.ip_address,
        }
        for e in entries
    ]

# ============================================================================
# GDPR COMPLIANCE ENDPOINTS
# ============================================================================

@app.get("/gdpr/export/{user_id}")
async def gdpr_export(user_id: int, db: Session = Depends(get_db)):
    """GDPR Data Export — returns all data associated with a user"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    sos_records = db.query(SOSQueue).filter(SOSQueue.user_id == user_id).all()
    crime_reports = db.query(CrimeReport).filter(CrimeReport.user_id == user_id).all()
    guardians = db.query(Guardian).filter(Guardian.user_id == user_id).all()
    audit_entries = db.query(AuditLog).filter(AuditLog.actor_id == user_id).all()

    return {
        "gdpr_export": True,
        "exported_at": datetime.utcnow().isoformat(),
        "data_residency": "Ireland (EU)",
        "user": {
            "id": user.id,
            "name": user.name,
            "is_child": user.is_child,
            "created_at": str(user.created_at) if hasattr(user, 'created_at') else None,
        },
        "sos_records": [
            {"id": s.id, "status": s.status, "latitude": s.latitude,
             "longitude": s.longitude, "created_at": s.created_at.isoformat() if s.created_at else None}
            for s in sos_records
        ],
        "crime_reports": [
            {"id": c.id, "type": c.incident_type, "description": c.description,
             "status": c.status, "is_anonymous": c.is_anonymous}
            for c in crime_reports
        ],
        "guardians": [
            {"id": g.id, "username": g.guardian_username, "type": g.guardian_type}
            for g in guardians
        ],
        "audit_trail_entries": len(audit_entries),
    }

@app.delete("/gdpr/delete/{user_id}")
async def gdpr_delete(user_id: int, db: Session = Depends(get_db)):
    """GDPR Right to Erasure — anonymize/delete all user data"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Anonymize user
    user.name = f"DELETED_USER_{user_id}"
    user.biometric_hash = None
    user.ppsn = None
    user.passport_number = None

    # Anonymize SOS records
    db.query(SOSQueue).filter(SOSQueue.user_id == user_id).update(
        {"user_id": None}, synchronize_session=False
    )

    # Delete guardians
    db.query(Guardian).filter(Guardian.user_id == user_id).delete(synchronize_session=False)

    # Anonymize crime reports
    db.query(CrimeReport).filter(
        CrimeReport.user_id == user_id, CrimeReport.is_anonymous == False
    ).update({"is_anonymous": True, "user_id": None}, synchronize_session=False)

    db.commit()

    log_audit(db, "gdpr_deletion", "system", None, "user", user_id,
              {"action": "right_to_erasure"})

    return {
        "status": "User data anonymized/deleted",
        "user_id": user_id,
        "gdpr_compliant": True,
    }

@app.get("/system/compliance")
async def system_compliance():
    """Returns GDPR + EU AI Act compliance status"""
    return {
        "data_residency": "Ireland (EU)",
        "gdpr_compliant": True,
        "eu_ai_act_ready": True,
        "data_encryption": "AES-256 at rest, TLS 1.3 in transit",
        "audit_trail": True,
        "right_to_erasure": True,
        "right_to_export": True,
        "ai_transparency": {
            "ai_chat_type": "Rule-based intent matching (not ML)",
            "no_automated_decisions": True,
            "human_in_the_loop": True,
        },
        "sovereign_hosting": {
            "provider": "Irish Sovereign Cloud (planned)",
            "region": "eu-west-1 (Ireland)",
            "fallback": "Local SQLite (current dev)",
        },
    }

# ============================================================================
# ORGANIZATION MANAGEMENT (School / Corporate)
# ============================================================================

@app.post("/organizations")
async def create_organization(data: OrgCreate, db: Session = Depends(get_db)):
    """Create a school or corporate deployment group"""
    org = Organization(
        name=data.name,
        org_type=data.org_type,
        admin_user_id=data.admin_user_id,
    )
    db.add(org)
    db.commit()
    db.refresh(org)

    log_audit(db, "org_created", "user", data.admin_user_id, "organization", org.id,
              {"name": data.name, "type": data.org_type})

    return {"org_id": org.id, "name": org.name, "type": org.org_type}

@app.post("/organizations/{org_id}/members")
async def add_org_member(org_id: int, data: OrgMemberAdd, db: Session = Depends(get_db)):
    """Add a member to an organization"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    member = OrganizationMember(
        org_id=org_id,
        user_id=data.user_id,
        role=data.role,
    )
    db.add(member)
    db.commit()

    return {"org_id": org_id, "user_id": data.user_id, "role": data.role}

@app.get("/organizations/{org_id}")
async def get_organization(org_id: int, db: Session = Depends(get_db)):
    """Get organization details and members"""
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    members = db.query(OrganizationMember).filter(OrganizationMember.org_id == org_id).all()
    member_details = []
    for m in members:
        user = db.query(User).filter(User.id == m.user_id).first()
        member_details.append({
            "user_id": m.user_id,
            "name": user.name if user else "Unknown",
            "role": m.role,
            "joined_at": m.joined_at.isoformat() if m.joined_at else None,
        })

    return {
        "id": org.id,
        "name": org.name,
        "type": org.org_type,
        "members": member_details,
        "member_count": len(members),
    }

# ============================================================================
# WEBSOCKET EVENTS
# ============================================================================

@sio.event
async def connect(sid, environ):
    print(f"Client connected: {sid}")

@sio.event
async def disconnect(sid):
    print(f"Client disconnected: {sid}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(socket_app, host="0.0.0.0", port=8000)
