from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import uuid
import os
import base64
import json

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Regulatory Compliance Co-Pilot API",
    description="AI-powered regulatory compliance checking for life-sciences documentation",
    version="2.0.0",
)
origins = [
    "http://localhost:3000",  # your frontend URL
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Optional DB (graceful fallback to in-memory) ──────────────────────────────
DB_AVAILABLE = False
try:
    from database import engine, SessionLocal
    import models
    models.Base.metadata.create_all(bind=engine)
    with engine.connect() as _conn:
        pass
    DB_AVAILABLE = True
    print("✅  Database connected")
except Exception as _db_err:
    print(f"⚠️   Database not available ({_db_err}). Using in-memory store.")

# ── Enums ─────────────────────────────────────────────────────────────────────
class DocumentStatus(str, Enum):
    UPLOADED   = "uploaded"
    PROCESSING = "processing"
    COMPLETED  = "completed"
    FAILED     = "failed"

class FindingSeverity(str, Enum):
    CRITICAL = "critical"
    MAJOR    = "major"
    MINOR    = "minor"

class FindingStatus(str, Enum):
    PENDING  = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ConfidenceLevel(str, Enum):
    HIGH   = "HIGH"
    MEDIUM = "MEDIUM"
    LOW    = "LOW"

# ── Pydantic models ───────────────────────────────────────────────────────────
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    organization: str

class UserProfileUpdate(BaseModel):
    full_name:    Optional[str] = None
    organization: Optional[str] = None
    role:         Optional[str] = None
    bio:          Optional[str] = None

class HistoryCreate(BaseModel):
    action:        str
    document_name: str
    document_id:   Optional[str] = None
    finding_title: Optional[str] = None
    section:       Optional[str] = None

class FeedbackRequest(BaseModel):
    finding_id:    str
    feedback_type: str
    comment:       Optional[str] = None

class ComplianceAnalysisRequest(BaseModel):
    document_id: str
    guidelines:  List[str]

class ChatMessage(BaseModel):
    role:      str
    content:   str
    timestamp: datetime

class ChatRequest(BaseModel):
    document_id:          str
    message:              str
    conversation_history: Optional[List[ChatMessage]] = []

# ── RAG Save models ───────────────────────────────────────────────────────────
class RagSection(BaseModel):
    title:               str
    riskLevel:           str
    missingRequirements: List[str]
    finalSuggestedAnswer: str
    citations:           Optional[List[Any]] = []

class RagSaveRequest(BaseModel):
    name:             str
    uploadDate:       str
    totalSections:    Optional[int] = 0
    highRiskSections: Optional[int] = 0
    sections:         List[RagSection]

# ── Constants ─────────────────────────────────────────────────────────────────
DEMO_USER_ID  = "demo-user-001"
ADMIN_USER_ID = "admin-user-001"

CREDENTIALS: Dict[str, Dict] = {
    "demo@compliance.ai":  {"password": "demo123",  "user_id": DEMO_USER_ID},
    "admin@compliance.ai": {"password": "admin123", "user_id": ADMIN_USER_ID},
}

# ── In-memory stores ──────────────────────────────────────────────────────────
documents_db:     Dict[str, Any]  = {}
findings_db:      Dict[str, Any]  = {}
history_db:       List[Dict]      = []

user_profiles_db: Dict[str, Any] = {
    DEMO_USER_ID: {
        "id": DEMO_USER_ID,
        "email": "demo@compliance.ai",
        "full_name": "Dr. Sarah Mitchell",
        "organization": "PharmaCorp International",
        "role": "Senior Regulatory Affairs Specialist",
        "bio": "Regulatory affairs professional with 12+ years experience in clinical trial compliance.",
        "created_at": datetime(2023, 3, 15),
    },
    ADMIN_USER_ID: {
        "id": ADMIN_USER_ID,
        "email": "admin@compliance.ai",
        "full_name": "Admin User",
        "organization": "CompliancePilot",
        "role": "Admin",
        "bio": "System administrator with full access to all features.",
        "created_at": datetime(2024, 1, 1),
    },
}

# ── Token helpers ─────────────────────────────────────────────────────────────
def create_token(user_id: str, email: str, role: str) -> str:
    payload = {"user_id": user_id, "email": email, "role": role}
    return base64.b64encode(json.dumps(payload).encode()).decode()

def decode_token(token: str) -> Optional[Dict]:
    try:
        return json.loads(base64.b64decode(token.encode()).decode())
    except Exception:
        return None

def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization:
        return DEMO_USER_ID
    token = authorization.replace("Bearer ", "").strip()
    if token in ("demo-token", "dummy-jwt-token", ""):
        return DEMO_USER_ID
    payload = decode_token(token)
    if not payload:
        return DEMO_USER_ID
    return payload.get("user_id", DEMO_USER_ID)

def is_demo(user_id: str) -> bool:
    return user_id == DEMO_USER_ID

# ── DB helpers ────────────────────────────────────────────────────────────────
def db_session():
    if not DB_AVAILABLE:
        return None
    try:
        return SessionLocal()
    except Exception:
        return None

def _uuid(s: str):
    try:
        return uuid.UUID(s)
    except Exception:
        return None

# ── Audit helper ──────────────────────────────────────────────────────────────
def record_action(
    user_id:       str,
    action:        str,
    document_name: str,
    document_id:   Optional[str] = None,
    finding_title: Optional[str] = None,
    section:       Optional[str] = None,
) -> Dict:
    entry = {
        "id":            str(uuid.uuid4()),
        "action":        action,
        "document_name": document_name,
        "document_id":   document_id,
        "finding_title": finding_title,
        "section":       section,
        "user_id":       user_id,
        "timestamp":     datetime.now(),
    }
    history_db.insert(0, entry)

    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            if db:
                from models import AuditLog
                action_map = {
                    "accepted":   "finding_accepted",
                    "rejected":   "finding_rejected",
                    "uploaded":   "document_upload",
                    "analyzed":   "analysis_started",
                    "exported":   "report_exported",
                    "user_login": "user_login",
                }
                details: Dict[str, Any] = {"document": document_name}
                if finding_title:
                    details["finding_title"] = finding_title
                uid = _uuid(user_id)
                rid = _uuid(document_id) if document_id else None
                log = models.AuditLog(
                    user_id=uid or uuid.uuid4(),
                    action=action_map.get(action, action),
                    resource_type="finding" if finding_title else "document",
                    resource_id=rid,
                    details=details,
                    ip_address="127.0.0.1",
                )
                db.add(log)
                db.commit()
                db.close()
        except Exception as e:
            print(f"Audit DB error: {e}")
    return entry

# ── Seed ──────────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    if not DB_AVAILABLE:
        return
    db = db_session()
    if not db:
        return
    try:
        import hashlib
        existing = db.query(models.User).filter(models.User.email == "admin@compliance.ai").first()
        if not existing:
            admin = models.User(
                email="admin@compliance.ai",
                hashed_password=hashlib.sha256("admin123".encode()).hexdigest(),
                full_name="Admin User",
                organization="CompliancePilot",
                role=models.UserRoleEnum.ADMIN,
            )
            db.add(admin)
            db.commit()
            db.refresh(admin)
            new_id = str(admin.id)
            CREDENTIALS["admin@compliance.ai"]["user_id"] = new_id
            user_profiles_db[new_id] = user_profiles_db.pop(ADMIN_USER_ID, {})
            user_profiles_db[new_id]["id"] = new_id
            print(f"✅  Admin user seeded: {new_id}")
    except Exception as e:
        print(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()

# ── Root / Health ─────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"message": "Regulatory Compliance Co-Pilot API", "version": "2.0.0", "db": DB_AVAILABLE}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": datetime.now(), "db": DB_AVAILABLE}

# ── Auth ──────────────────────────────────────────────────────────────────────
@app.post("/api/v1/auth/login")
async def login(credentials: UserLogin):
    cred = CREDENTIALS.get(credentials.email)
    if cred and cred["password"] == credentials.password:
        uid = cred["user_id"]
        profile = user_profiles_db.get(uid, {})
        record_action(uid, "user_login", "System")
        return {
            "access_token": create_token(uid, credentials.email, profile.get("role", "reviewer")),
            "token_type":   "bearer",
            "expires_in":   86400,
            "user_id":      uid,
            "email":        credentials.email,
            "full_name":    profile.get("full_name", credentials.email),
            "role":         profile.get("role", "reviewer"),
            "organization": profile.get("organization", ""),
        }

    # DB fallback for registered users
    if DB_AVAILABLE:
        try:
            import hashlib
            db = db_session()
            if db:
                u = db.query(models.User).filter(models.User.email == credentials.email).first()
                db.close()
                if u and u.hashed_password == hashlib.sha256(credentials.password.encode()).hexdigest():
                    uid = str(u.id)
                    record_action(uid, "user_login", "System")
                    return {
                        "access_token": create_token(uid, credentials.email, str(u.role)),
                        "token_type":   "bearer",
                        "expires_in":   86400,
                        "user_id":      uid,
                        "email":        credentials.email,
                        "full_name":    u.full_name,
                        "role":         str(u.role),
                        "organization": u.organization or "",
                    }
        except Exception as e:
            print(f"DB login error: {e}")

    raise HTTPException(status_code=401, detail="Invalid email or password")

@app.post("/api/v1/auth/register")
async def register(user: UserRegistration):
    if user.email in CREDENTIALS:
        raise HTTPException(status_code=400, detail="User already exists")
    uid = str(uuid.uuid4())
    if DB_AVAILABLE:
        try:
            import hashlib
            db = db_session()
            if db:
                new_u = models.User(
                    email=user.email,
                    hashed_password=hashlib.sha256(user.password.encode()).hexdigest(),
                    full_name=user.full_name,
                    organization=user.organization,
                )
                db.add(new_u)
                db.commit()
                db.refresh(new_u)
                uid = str(new_u.id)
                db.close()
        except Exception as e:
            print(f"DB register error: {e}")
    CREDENTIALS[user.email] = {"password": user.password, "user_id": uid}
    user_profiles_db[uid] = {
        "id": uid, "email": user.email, "full_name": user.full_name,
        "organization": user.organization, "role": "reviewer", "bio": None,
        "created_at": datetime.now(),
    }
    return {"message": "Registered successfully", "user_id": uid}

# ── Documents ─────────────────────────────────────────────────────────────────
@app.post("/api/v1/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
):
    allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]
    if file.content_type not in allowed:
        raise HTTPException(status_code=400, detail="Only PDF/DOCX supported")

    # Read file bytes once and encode for later use in chat (pass to Claude)
    file_bytes = await file.read()
    file_b64 = base64.b64encode(file_bytes).decode("utf-8")

    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id, "name": file.filename,
        "upload_date": datetime.now(), "status": DocumentStatus.UPLOADED,
        "guidelines": [], "user_id": user_id, "file_size": len(file_bytes),
        "page_count": None, "compliance_score": None,
        "created_at": datetime.now(),
        # Store base64 so the chat endpoint can pass the raw PDF to Claude
        "file_content_base64": file_b64,
        "file_media_type": file.content_type,
    }
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            if db:
                uid = _uuid(user_id) or uuid.uuid4()
                db_doc = models.Document(
                    name=file.filename, original_filename=file.filename,
                    user_id=uid, status="uploaded",
                )
                db.add(db_doc); db.commit(); db.refresh(db_doc)
                doc_id = str(db_doc.id)
                doc["id"] = doc_id
                db.close()
        except Exception as e:
            print(f"DB upload error: {e}")
    documents_db[doc_id] = doc
    record_action(user_id, "uploaded", file.filename, doc_id)
    return {"document_id": doc_id, "upload_url": f"https://s3.amazonaws.com/uploads/{doc_id}", "status": "uploaded"}

@app.get("/api/v1/documents")
async def list_documents(user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                docs = db.query(models.Document).filter(models.Document.user_id == uid)\
                    .order_by(models.Document.created_at.desc()).all()
                db.close()
                return [{
                    "id": str(d.id), "name": d.name,
                    "upload_date": d.created_at, "created_at": d.created_at,
                    "status": d.status, "guidelines": d.guidelines or [],
                    "user_id": str(d.user_id), "file_size": d.file_size,
                    "page_count": d.page_count, "compliance_score": d.compliance_score,
                } for d in docs]
        except Exception as e:
            print(f"DB list error: {e}")
    return [d for d in documents_db.values() if d.get("user_id") == user_id]

@app.get("/api/v1/documents/{document_id}")
async def get_document(document_id: str, user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(document_id)
            if db and uid:
                d = db.query(models.Document).filter(models.Document.id == uid).first()
                db.close()
                if d:
                    return {
                        "id": str(d.id), "name": d.name,
                        "upload_date": d.created_at, "created_at": d.created_at,
                        "status": d.status, "guidelines": d.guidelines or [],
                        "user_id": str(d.user_id), "file_size": d.file_size,
                        "page_count": d.page_count, "compliance_score": d.compliance_score,
                    }
        except Exception as e:
            print(f"DB get doc error: {e}")
    if document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    return documents_db[document_id]

# ── RAG Save ──────────────────────────────────────────────────────────────────
@app.post("/api/v1/rag/save")
async def save_rag_result(
    payload: RagSaveRequest,
    user_id: str = Depends(get_current_user_id),
):
    """Persist RAG (Lambda) analysis results to backend storage."""
    def risk_to_sev(risk: str) -> FindingSeverity:
        return {
            "High":   FindingSeverity.CRITICAL,
            "Medium": FindingSeverity.MAJOR,
        }.get(risk, FindingSeverity.MINOR)

    valid_sections = [s for s in payload.sections if s.riskLevel != "ParsingError"]
    total = len(valid_sections)
    high  = sum(1 for s in valid_sections if s.riskLevel == "High")
    med   = sum(1 for s in valid_sections if s.riskLevel == "Medium")
    score = max(0, round(100 - high * 15 - med * 5)) if total else None

    doc_id = str(uuid.uuid4())

    # ── Try DB for non-demo ───────────────────────────────────────────────────
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id) or uuid.uuid4()
            if db:
                db_doc = models.Document(
                    name=payload.name, original_filename=payload.name,
                    user_id=uid, status="completed",
                    guidelines=["RAG-Analysis"], compliance_score=score,
                )
                db.add(db_doc); db.flush()

                for sec in valid_sections:
                    ref_text = ref_cite = ""
                    if sec.citations:
                        for cit in sec.citations:
                            if isinstance(cit, dict):
                                refs = cit.get("retrievedReferences", [])
                                if refs:
                                    ref_text = refs[0].get("content", {}).get("text", "")[:500]
                                    uri = refs[0].get("location", {}).get("s3Location", {}).get("uri", "")
                                    ref_cite = uri.split("/")[-1] if uri else ""
                                    break
                    sev = risk_to_sev(sec.riskLevel)
                    f = models.Finding(
                        document_id=db_doc.id,
                        severity=models.FindingSeverityEnum(sev.value),
                        status=models.FindingStatusEnum.PENDING,
                        section=sec.title[:500], title=sec.title[:500],
                        document_text="\n".join(sec.missingRequirements)[:2000],
                        regulatory_text=ref_text, citation=ref_cite,
                        gap_analysis="\n".join(sec.missingRequirements)[:2000],
                        suggested_fix=sec.finalSuggestedAnswer[:2000],
                        confidence=models.ConfidenceLevelEnum.HIGH,
                    )
                    db.add(f)

                audit = models.AuditLog(
                    user_id=db_doc.user_id, action="analysis_started",
                    resource_type="document", resource_id=db_doc.id,
                    details={"document": payload.name, "sections": total, "score": score},
                    ip_address="127.0.0.1",
                )
                db.add(audit); db.commit(); db.refresh(db_doc)
                doc_id = str(db_doc.id)
                db.close()
        except Exception as e:
            print(f"DB RAG save error: {e}")

    # ── In-memory ─────────────────────────────────────────────────────────────
    documents_db[doc_id] = {
        "id": doc_id, "name": payload.name,
        "upload_date": datetime.now(), "created_at": datetime.now(),
        "status": DocumentStatus.COMPLETED, "guidelines": ["RAG-Analysis"],
        "user_id": user_id, "file_size": None, "page_count": None,
        "compliance_score": score,
    }
    for sec in valid_sections:
        ref_text = ref_cite = ""
        if sec.citations:
            for cit in sec.citations:
                if isinstance(cit, dict):
                    refs = cit.get("retrievedReferences", [])
                    if refs:
                        ref_text = refs[0].get("content", {}).get("text", "")[:500]
                        uri = refs[0].get("location", {}).get("s3Location", {}).get("uri", "")
                        ref_cite = uri.split("/")[-1] if uri else ""
                        break
        fid = str(uuid.uuid4())
        findings_db[fid] = {
            "id": fid, "document_id": doc_id,
            "severity": risk_to_sev(sec.riskLevel),
            "section": sec.title, "title": sec.title,
            "document_text": "\n".join(sec.missingRequirements),
            "regulatory_text": ref_text, "citation": ref_cite,
            "gap_analysis": "\n".join(sec.missingRequirements),
            "suggested_fix": sec.finalSuggestedAnswer,
            "confidence": ConfidenceLevel.HIGH,
            "status": FindingStatus.PENDING, "feedback": None,
            "created_at": datetime.now(),
        }

    record_action(user_id, "analyzed", payload.name, doc_id)
    return {"document_id": doc_id, "message": "Saved successfully", "compliance_score": score}

# ── Compliance ────────────────────────────────────────────────────────────────
def _get_findings_sync(document_id: str, user_id: str, severity: Optional[str] = None) -> List[Dict]:
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(document_id)
            if db and uid:
                q = db.query(models.Finding).filter(models.Finding.document_id == uid)
                if severity:
                    q = q.filter(models.Finding.severity == severity)
                rows = q.all(); db.close()
                if rows:
                    return [{
                        "id": str(r.id), "document_id": str(r.document_id),
                        "severity": r.severity, "section": r.section or "",
                        "title": r.title, "document_text": r.document_text or "",
                        "regulatory_text": r.regulatory_text or "",
                        "citation": r.citation or "", "gap_analysis": r.gap_analysis or "",
                        "suggested_fix": r.suggested_fix or "",
                        "confidence": r.confidence or "MEDIUM",
                        "status": r.status, "feedback": r.user_feedback,
                        "created_at": r.created_at,
                    } for r in rows]
        except Exception as e:
            print(f"DB findings error: {e}")
    result = [f for f in findings_db.values() if f["document_id"] == document_id]
    if severity:
        result = [f for f in result if str(f.get("severity", "")) == severity]
    return result

@app.post("/api/v1/compliance/analyze")
async def analyze_compliance(
    req: ComplianceAnalysisRequest,
    user_id: str = Depends(get_current_user_id),
):
    if req.document_id not in documents_db:
        raise HTTPException(status_code=404, detail="Document not found")
    documents_db[req.document_id]["status"] = DocumentStatus.PROCESSING
    documents_db[req.document_id]["guidelines"] = req.guidelines
    # Generate demo findings
    dummies = [
        {"severity": FindingSeverity.CRITICAL, "section": "4.2 Study Objectives", "title": "Primary Endpoint Not Explicitly Defined", "document_text": "Study will measure efficacy through various clinical assessments.", "regulatory_text": "ICH E6(R2) §6.9.4: primary endpoint(s) should be clearly defined.", "citation": "ICH E6(R2) §6.9.4", "gap_analysis": "No specific primary endpoint identified.", "suggested_fix": "Primary endpoint is change from baseline in [measure] at [timepoint]."},
        {"severity": FindingSeverity.CRITICAL, "section": "4.8 Informed Consent", "title": "Missing Study Purpose Statement", "document_text": "Participants will be informed about procedures.", "regulatory_text": "ICH E6(R2) §4.8.1: explain the purposes of the research.", "citation": "ICH E6(R2) §4.8.1", "gap_analysis": "ICF does not state trial involves research.", "suggested_fix": "Add: 'This study is a research trial designed to evaluate...'"},
        {"severity": FindingSeverity.MAJOR, "section": "5.3 Safety Monitoring", "title": "Incomplete Adverse Event Reporting Timeline", "document_text": "Adverse events will be reported to the sponsor.", "regulatory_text": "ICH E6(R2) §4.11.1: report all SAEs immediately.", "citation": "ICH E6(R2) §4.11.1", "gap_analysis": "No timeline for AE reporting.", "suggested_fix": "All SAEs will be reported within 24 hours of awareness."},
    ]
    for d in dummies:
        fid = str(uuid.uuid4())
        findings_db[fid] = {"id": fid, "document_id": req.document_id, **d,
                            "confidence": ConfidenceLevel.HIGH, "status": FindingStatus.PENDING,
                            "feedback": None, "created_at": datetime.now()}
    documents_db[req.document_id]["status"] = DocumentStatus.COMPLETED
    record_action(user_id, "analyzed", documents_db[req.document_id]["name"], req.document_id)
    return {"job_id": str(uuid.uuid4()), "document_id": req.document_id, "status": "completed", "findings_count": len(dummies)}

@app.get("/api/v1/compliance/{document_id}/findings")
async def get_findings(
    document_id: str,
    severity: Optional[FindingSeverity] = None,
    user_id: str = Depends(get_current_user_id),
):
    return _get_findings_sync(document_id, user_id, severity.value if severity else None)

@app.get("/api/v1/compliance/{document_id}/stats")
async def get_stats(document_id: str, user_id: str = Depends(get_current_user_id)):
    findings = _get_findings_sync(document_id, user_id)
    def _sev(f, s): return str(f.get("severity", "")) == s
    def _sta(f, s): return str(f.get("status", "")) == s
    return {
        "critical": sum(1 for f in findings if _sev(f, "critical")),
        "major":    sum(1 for f in findings if _sev(f, "major")),
        "minor":    sum(1 for f in findings if _sev(f, "minor")),
        "accepted": sum(1 for f in findings if _sta(f, "accepted")),
        "rejected": sum(1 for f in findings if _sta(f, "rejected")),
        "pending":  sum(1 for f in findings if _sta(f, "pending")),
    }

@app.put("/api/v1/compliance/findings/{finding_id}/status")
async def update_finding_status(
    finding_id: str,
    status: FindingStatus,
    user_id: str = Depends(get_current_user_id),
):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(finding_id)
            if db and uid:
                f = db.query(models.Finding).filter(models.Finding.id == uid).first()
                if f:
                    f.status = models.FindingStatusEnum(status.value)
                    db.commit()
                    doc = db.query(models.Document).filter(models.Document.id == f.document_id).first()
                    doc_name = doc.name if doc else "Unknown"
                    doc_id = str(f.document_id)
                    title = f.title
                    db.close()
                    record_action(user_id, status.value, doc_name, doc_id, title)
                    return {"message": "Updated", "finding_id": finding_id, "status": status}
        except Exception as e:
            print(f"DB update status error: {e}")

    if finding_id not in findings_db:
        raise HTTPException(status_code=404, detail="Finding not found")
    findings_db[finding_id]["status"] = status
    f = findings_db[finding_id]
    doc = documents_db.get(f["document_id"], {})
    record_action(user_id, status.value, doc.get("name", ""), f["document_id"], f["title"], f.get("section"))
    return {"message": "Updated", "finding_id": finding_id, "status": status}

@app.post("/api/v1/compliance/findings/{finding_id}/feedback")
async def submit_feedback(
    finding_id: str,
    feedback: FeedbackRequest,
    user_id: str = Depends(get_current_user_id),
):
    if finding_id in findings_db:
        findings_db[finding_id]["feedback"] = feedback.feedback_type
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(finding_id)
            if db and uid:
                f = db.query(models.Finding).filter(models.Finding.id == uid).first()
                if f:
                    f.user_feedback = feedback.feedback_type
                    f.feedback_comment = feedback.comment
                    f.feedback_submitted_at = datetime.now()
                    db.commit(); db.close()
        except Exception as e:
            print(f"DB feedback error: {e}")
    return {"message": "Feedback submitted"}

# ── Analytics ─────────────────────────────────────────────────────────────────
@app.get("/api/v1/analytics/dashboard")
async def analytics(user_id: str = Depends(get_current_user_id)):
    if is_demo(user_id):
        return {
            "total_documents": 24, "avg_compliance_score": 85,
            "time_saved_percentage": 60, "critical_issues_found": 47,
            "documents_by_month": [{"month": "Jan", "count": 5}, {"month": "Feb", "count": 8}, {"month": "Mar", "count": 11}],
            "compliance_trends": {"completed": 18, "processing": 3, "failed": 2, "uploaded": 1},
        }

    if DB_AVAILABLE:
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                docs = db.query(models.Document).filter(models.Document.user_id == uid).all()
                all_fids = [d.id for d in docs]
                critical = 0
                if all_fids:
                    critical = db.query(models.Finding).filter(
                        models.Finding.document_id.in_(all_fids),
                        models.Finding.severity == "critical"
                    ).count()
                db.close()
                completed = [d for d in docs if d.status == "completed"]
                avg = round(sum(d.compliance_score or 0 for d in completed) / max(len(completed), 1), 1)
                return {
                    "total_documents": len(docs),
                    "avg_compliance_score": avg,
                    "time_saved_percentage": min(99, len(docs) * 4),
                    "critical_issues_found": critical,
                    "documents_by_month": [],
                    "compliance_trends": {
                        "completed":  sum(1 for d in docs if d.status == "completed"),
                        "processing": sum(1 for d in docs if d.status == "processing"),
                        "failed":     sum(1 for d in docs if d.status == "failed"),
                        "uploaded":   sum(1 for d in docs if d.status == "uploaded"),
                    },
                }
        except Exception as e:
            print(f"DB analytics error: {e}")

    user_docs = [d for d in documents_db.values() if d.get("user_id") == user_id]
    completed = [d for d in user_docs if d.get("status") == "completed"]
    avg = round(sum(d.get("compliance_score") or 0 for d in completed) / max(len(completed), 1), 1)
    user_findings = [f for f in findings_db.values() if documents_db.get(f["document_id"], {}).get("user_id") == user_id]
    return {
        "total_documents": len(user_docs),
        "avg_compliance_score": avg,
        "time_saved_percentage": min(99, len(user_docs) * 4),
        "critical_issues_found": sum(1 for f in user_findings if str(f.get("severity")) == "critical"),
        "documents_by_month": [],
        "compliance_trends": {
            "completed":  sum(1 for d in user_docs if d.get("status") == "completed"),
            "processing": sum(1 for d in user_docs if d.get("status") == "processing"),
            "failed":     sum(1 for d in user_docs if d.get("status") == "failed"),
            "uploaded":   sum(1 for d in user_docs if d.get("status") == "uploaded"),
        },
    }

# ── History ───────────────────────────────────────────────────────────────────
@app.get("/api/v1/history")
async def get_history(limit: int = 50, user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                logs = db.query(models.AuditLog)\
                    .filter(models.AuditLog.user_id == uid)\
                    .order_by(models.AuditLog.timestamp.desc())\
                    .limit(limit).all()
                db.close()
                if logs:
                    action_reverse = {
                        "finding_accepted": "accepted", "finding_rejected": "rejected",
                        "document_upload": "uploaded", "analysis_started": "analyzed",
                        "report_exported": "exported", "user_login": "login",
                    }
                    return [{
                        "id": str(l.id),
                        "action": action_reverse.get(l.action, l.action),
                        "document_name": l.details.get("document", "") if l.details else "",
                        "document_id": str(l.resource_id) if l.resource_id else None,
                        "finding_title": l.details.get("finding_title") if l.details else None,
                        "section": None,
                        "user_id": str(l.user_id),
                        "timestamp": l.timestamp,
                    } for l in logs]
        except Exception as e:
            print(f"DB history error: {e}")
    return [h for h in history_db if h.get("user_id") == user_id][:limit]

@app.post("/api/v1/history")
async def add_history(entry: HistoryCreate, user_id: str = Depends(get_current_user_id)):
    return record_action(user_id, entry.action, entry.document_name,
                         entry.document_id, entry.finding_title, entry.section)

# ── Audit Trail ───────────────────────────────────────────────────────────────
@app.get("/api/v1/audit/trail")
async def audit_trail(document_id: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                q = db.query(models.AuditLog).filter(models.AuditLog.user_id == uid)
                if document_id:
                    rid = _uuid(document_id)
                    if rid:
                        q = q.filter(models.AuditLog.resource_id == rid)
                logs = q.order_by(models.AuditLog.timestamp.desc()).limit(200).all()
                profile = user_profiles_db.get(user_id, {})
                db.close()
                return {"logs": [{
                    "id": str(l.id), "timestamp": l.timestamp,
                    "user": profile.get("full_name", "Admin"),
                    "action": l.action, "resource_type": l.resource_type,
                    "resource_id": str(l.resource_id) if l.resource_id else None,
                    "details": l.details or {}, "ip_address": l.ip_address or "127.0.0.1",
                    "status": "success",
                } for l in logs]}
        except Exception as e:
            print(f"DB audit error: {e}")

    # In-memory fallback
    action_map = {
        "accepted": "finding_accepted", "rejected": "finding_rejected",
        "uploaded": "document_upload", "analyzed": "analysis_started",
        "exported": "report_exported", "user_login": "user_login", "login": "user_login",
    }
    profile = user_profiles_db.get(user_id, {})
    logs = []
    for h in history_db:
        if h.get("user_id") != user_id:
            continue
        if document_id and h.get("document_id") != document_id:
            continue
        details: Dict[str, Any] = {"document": h.get("document_name", "")}
        if h.get("finding_title"):
            details["finding_title"] = h["finding_title"]
        logs.append({
            "id": h["id"], "timestamp": h["timestamp"],
            "user": profile.get("full_name", user_id),
            "action": action_map.get(h["action"], h["action"]),
            "resource_type": "finding" if h.get("finding_title") else "document",
            "resource_id": h.get("document_id"),
            "details": details, "ip_address": "127.0.0.1", "status": "success",
        })
    return {"logs": logs}

# ── User Profile ──────────────────────────────────────────────────────────────
@app.get("/api/v1/users/me")
async def get_profile(user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                u = db.query(models.User).filter(models.User.id == uid).first()
                db.close()
                if u:
                    return {"id": str(u.id), "email": u.email, "full_name": u.full_name,
                            "organization": u.organization or "", "role": str(u.role),
                            "bio": None, "created_at": u.created_at}
        except Exception as e:
            print(f"DB profile error: {e}")
    if user_id not in user_profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    return user_profiles_db[user_id]

@app.put("/api/v1/users/me")
async def update_profile(updates: UserProfileUpdate, user_id: str = Depends(get_current_user_id)):
    if DB_AVAILABLE and not is_demo(user_id):
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                u = db.query(models.User).filter(models.User.id == uid).first()
                if u:
                    if updates.full_name:    u.full_name    = updates.full_name
                    if updates.organization: u.organization = updates.organization
                    db.commit(); db.refresh(u); db.close()
                    return {"id": str(u.id), "email": u.email, "full_name": u.full_name,
                            "organization": u.organization or "", "role": str(u.role),
                            "bio": None, "created_at": u.created_at}
        except Exception as e:
            print(f"DB update profile error: {e}")
    if user_id not in user_profiles_db:
        raise HTTPException(status_code=404, detail="Profile not found")
    profile = user_profiles_db[user_id]
    profile.update(updates.dict(exclude_none=True))
    return profile

@app.get("/api/v1/users/me/stats")
async def my_stats(user_id: str = Depends(get_current_user_id)):
    if is_demo(user_id):
        return {"documents_analyzed": 24, "findings_reviewed": 142,
                "findings_accepted": 89, "findings_rejected": 53,
                "avg_compliance_score": 85.2, "hours_saved": 134.4}
    if DB_AVAILABLE:
        try:
            db = db_session()
            uid = _uuid(user_id)
            if db and uid:
                docs = db.query(models.Document).filter(models.Document.user_id == uid).all()
                accepted = db.query(models.AuditLog).filter(
                    models.AuditLog.user_id == uid,
                    models.AuditLog.action == "finding_accepted").count()
                rejected = db.query(models.AuditLog).filter(
                    models.AuditLog.user_id == uid,
                    models.AuditLog.action == "finding_rejected").count()
                db.close()
                completed = [d for d in docs if d.status == "completed"]
                avg = round(sum(d.compliance_score or 0 for d in completed) / max(len(completed), 1), 1)
                return {"documents_analyzed": len(docs), "findings_reviewed": accepted + rejected,
                        "findings_accepted": accepted, "findings_rejected": rejected,
                        "avg_compliance_score": avg, "hours_saved": round(len(docs) * 5.6, 1)}
        except Exception as e:
            print(f"DB stats error: {e}")
    user_docs = [d for d in documents_db.values() if d.get("user_id") == user_id]
    hist = [h for h in history_db if h.get("user_id") == user_id]
    acc = len([h for h in hist if h["action"] in ("accepted", "finding_accepted")])
    rej = len([h for h in hist if h["action"] in ("rejected", "finding_rejected")])
    completed = [d for d in user_docs if d.get("status") == "completed"]
    avg = round(sum(d.get("compliance_score") or 0 for d in completed) / max(len(completed), 1), 1)
    return {"documents_analyzed": len(user_docs), "findings_reviewed": acc + rej,
            "findings_accepted": acc, "findings_rejected": rej,
            "avg_compliance_score": avg, "hours_saved": round(len(user_docs) * 5.6, 1)}

# ── Chat ──────────────────────────────────────────────────────────────────────
class ChatMessageHistory(BaseModel):
    role: str
    content: str

class DocumentChatRequest(BaseModel):
    document_id: str
    message: str
    conversation_history: Optional[List[ChatMessageHistory]] = []
    # Optional: frontend can supply base64 if it has the file cached
    document_base64: Optional[str] = None
    document_media_type: Optional[str] = "application/pdf"

@app.post("/api/v1/chat")
async def chat(req: ChatRequest, user_id: str = Depends(get_current_user_id)):
    doc = documents_db.get(req.document_id)
    doc_name = doc["name"] if doc else "the document"
    q = req.message.lower()
    if any(k in q for k in ["critical", "urgent", "serious"]):
        resp = f"Found **2 critical findings** in '{doc_name}':\n\n1. **Primary Endpoint Not Explicitly Defined** (§4.2)\n2. **Missing Study Purpose in Informed Consent** (§4.8)"
        sources = [{"citation": "ICH E6(R2) §6.9.4", "text": "Primary endpoint"}, {"citation": "ICH E6(R2) §4.8.1", "text": "Informed consent"}]
    elif any(k in q for k in ["summar", "overview"]):
        resp = f"**Summary for '{doc_name}'**: Analysis complete. Review the findings panel for all details."
        sources = [{"citation": "Analysis Report", "text": "Summary"}]
    else:
        resp = f"Analyzing **'{doc_name}'**. Ask me about critical findings, compliance score, sections needing attention, or suggested fixes."
        sources = []
    return {"response": resp, "sources": sources, "timestamp": datetime.now()}

@app.post("/api/v1/chat/document")
async def chat_with_document(req: DocumentChatRequest, user_id: str = Depends(get_current_user_id)):
    """
    Intelligent chatbot that converses about a specific document using Claude AI.
    Takes document findings and conversation history to provide detailed, cited responses.
    """
    # Get document
    doc = documents_db.get(req.document_id)
    if not doc and DB_AVAILABLE:
        try:
            db = db_session()
            uid = _uuid(req.document_id)
            if db and uid:
                db_doc = db.query(models.Document).filter(models.Document.id == uid).first()
                if db_doc:
                    doc = {
                        "id": str(db_doc.id),
                        "name": db_doc.name,
                        "status": db_doc.status,
                        "compliance_score": db_doc.compliance_score,
                    }
                db.close()
        except Exception as e:
            print(f"DB doc fetch error: {e}")
    
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Get all findings for this document
    findings = _get_findings_sync(req.document_id, user_id)

    # Build context from findings
    findings_context = _build_findings_context(findings, doc)

    # Get conversation history (last 3 exchanges = 6 messages)
    history = req.conversation_history[-6:] if req.conversation_history else []

    # Resolve PDF base64: prefer what frontend sent, then fall back to stored bytes
    doc_base64 = req.document_base64 or doc.get("file_content_base64")
    doc_media_type = req.document_media_type or doc.get("file_media_type", "application/pdf")

    # Call Lambda (or fallback to direct Claude)
    lambda_url = os.getenv('LAMBDA_CHATBOT_URL', '')

    if lambda_url:
        # Use Lambda function
        try:
            import requests

            lambda_payload = {
                "document_name": doc.get("name", "Document"),
                "findings_summary": findings_context[:3000],
                "compliance_score": doc.get("compliance_score"),
                "message": req.message,
                "conversation_history": [
                    {"role": msg.role, "content": msg.content}
                    for msg in history
                ],
                "document_base64": doc_base64,
                "document_media_type": doc_media_type,
            }
            
            response = requests.post(lambda_url, json=lambda_payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                response_text = result.get("response", "")
                citations = result.get("sources", [])
                
                # Save to chat history
                if DB_AVAILABLE and not is_demo(user_id):
                    try:
                        db = db_session()
                        if db:
                            uid = _uuid(user_id)
                            did = _uuid(req.document_id)
                            if uid and did:
                                db.add(models.ChatHistory(
                                    document_id=did, user_id=uid,
                                    role="user", content=req.message,
                                    sources=None
                                ))
                                db.add(models.ChatHistory(
                                    document_id=did, user_id=uid,
                                    role="assistant", content=response_text,
                                    sources=citations
                                ))
                                db.commit()
                            db.close()
                    except Exception as e:
                        print(f"Chat history save error: {e}")
                
                return {
                    "response": response_text,
                    "sources": citations,
                    "timestamp": datetime.now(),
                    "document_id": req.document_id
                }
            else:
                print(f"Lambda returned status {response.status_code}")
                raise Exception("Lambda call failed")
                
        except Exception as e:
            print(f"Lambda call error: {e}")
            # Fall through to fallback
    
    # Direct Bedrock call (no Lambda URL configured)
    try:
        response_text, citations = await _call_claude_for_chat(
            document_name=doc.get("name", "Document"),
            findings_context=findings_context,
            conversation_history=history,
            user_message=req.message,
            compliance_score=doc.get("compliance_score"),
            document_base64=doc_base64,
            document_media_type=doc_media_type,
        )
        return {
            "response": response_text,
            "sources": citations,
            "timestamp": datetime.now(),
            "document_id": req.document_id
        }
    except Exception as e:
        print(f"Direct Bedrock call error: {e}")

    # Last-resort keyword fallback
    return {
        "response": _get_fallback_response(req.message, doc, findings),
        "sources": _get_fallback_sources(findings[:3]),
        "timestamp": datetime.now(),
        "document_id": req.document_id
    }

def _build_findings_context(findings: List[Dict], doc: Dict) -> str:
    """Build a structured context string from findings for Claude"""
    if not findings:
        return f"Document '{doc.get('name')}' has been uploaded but no findings are available yet."
    
    context_parts = [
        f"Document: {doc.get('name')}",
        f"Status: {doc.get('status')}",
        f"Compliance Score: {doc.get('compliance_score', 'N/A')}%",
        f"\nFindings Analysis ({len(findings)} total):\n"
    ]
    
    # Group by severity
    critical = [f for f in findings if str(f.get('severity', '')).lower() == 'critical']
    major = [f for f in findings if str(f.get('severity', '')).lower() == 'major']
    minor = [f for f in findings if str(f.get('severity', '')).lower() == 'minor']
    
    for severity_name, severity_findings in [("CRITICAL", critical), ("MAJOR", major), ("MINOR", minor)]:
        if severity_findings:
            context_parts.append(f"\n{severity_name} Issues ({len(severity_findings)}):")
            for i, f in enumerate(severity_findings[:10], 1):  # Limit to 10 per severity
                context_parts.append(
                    f"\n{i}. [{f.get('section', 'N/A')}] {f.get('title', 'Untitled')}\n"
                    f"   Document Text: {f.get('document_text', 'N/A')[:200]}...\n"
                    f"   Gap: {f.get('gap_analysis', 'N/A')[:200]}...\n"
                    f"   Regulatory Requirement: {f.get('regulatory_text', 'N/A')[:200]}...\n"
                    f"   Citation: {f.get('citation', 'N/A')}\n"
                    f"   Suggested Fix: {f.get('suggested_fix', 'N/A')[:200]}...\n"
                    f"   Status: {f.get('status', 'pending')}"
                )
    
    return "\n".join(context_parts)

async def _call_claude_for_chat(
    document_name: str,
    findings_context: str,
    conversation_history: List[ChatMessageHistory],
    user_message: str,
    compliance_score: Optional[float] = None,
    document_base64: Optional[str] = None,
    document_media_type: str = "application/pdf",
) -> tuple[str, List[Dict]]:
    """Call Claude 4 Sonnet via AWS Bedrock for intelligent document chat"""
    import boto3
    import json

    bedrock = boto3.client(
        service_name='bedrock-runtime',
        region_name=os.getenv('AWS_REGION', 'ap-northeast-1')
    )

    score_text = f"{compliance_score}%" if compliance_score is not None else "Not yet calculated"

    system_prompt = f"""You are **DocBot**, a senior regulatory compliance expert AI assistant specialising in pharmaceutical and clinical trial documentation. You have deep expertise in ICH guidelines (E6, E8, E9, E10, Q8–Q12), FDA regulations (21 CFR Parts 11, 50, 54, 56, 312, 314), EMA directives, and GCP/GMP/GLP standards.

---

## Document Under Review
- **Document Name:** {document_name}
- **Overall Compliance Score:** {score_text}

## Findings Analysis Context
{findings_context}

---

## Response Format Rules

### Structure
1. **Executive Summary** — Start every response with 1–2 sentences that directly answer the question.
2. **Detailed Analysis** — Use `##` and `###` headings to organise sections. Group related points logically.
3. **Findings Table** — When listing multiple findings, always use a Markdown table with columns: `| # | Section | Severity | Issue | Regulatory Basis |`
4. **Recommended Actions** — End with a numbered action list when the user asks about fixes or next steps.
5. **References** — Close every response with a `## References` section listing all cited standards.

### Formatting
- Use **bold** for severity labels (CRITICAL, MAJOR, MINOR), regulatory names, and section numbers.
- Use `> blockquote` for direct quotes from the document or regulatory text.
- Use numbered lists for ordered steps or prioritised actions.
- Use bullet lists for unordered items.
- Use code blocks only for suggested corrective text/language insertions.

### Citations
- Document sections: `[Section 4.2]`
- Regulatory standards: `[Citation: ICH E6(R2) §4.8.1]` or `[Citation: FDA 21 CFR §312.23(a)]`
- Every regulatory claim MUST include a citation.
- If the full PDF document is attached, quote or reference its actual content.

### Quality Standards
- Be specific and detailed — avoid vague summaries.
- Explain WHY each gap is a compliance risk and WHICH regulation it violates.
- For critical issues, state the regulatory consequence.
- If data is not present in the findings or document, state: *"This information is not available in the current analysis."*
- Never fabricate citations, section numbers, or regulatory text.
- Prioritise: CRITICAL → MAJOR → MINOR."""

    # Build conversation messages
    messages = []
    for msg in conversation_history:
        messages.append({"role": msg.role, "content": msg.content})

    # Attach PDF document block to the current user message if available
    if document_base64:
        current_content = [
            {
                "type": "document",
                "source": {
                    "type": "base64",
                    "media_type": document_media_type,
                    "data": document_base64
                },
                "title": document_name,
                "context": (
                    "This is the regulatory compliance document under review. "
                    "Use its actual content to answer questions accurately."
                )
            },
            {"type": "text", "text": user_message}
        ]
        messages.append({"role": "user", "content": current_content})
    else:
        messages.append({"role": "user", "content": user_message})

    # Claude Sonnet 4.5 on Bedrock
    model_id = os.getenv(
        "BEDROCK_MODEL_ID",
        "anthropic.claude-sonnet-4-5-20251101-v1:0"
    )

    request_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4096,
        "temperature": 0.3,
        "system": system_prompt,
        "messages": messages
    }

    response = bedrock.invoke_model(
        modelId=model_id,
        body=json.dumps(request_body)
    )

    response_body = json.loads(response['body'].read())
    response_text = response_body['content'][0]['text']
    citations = _extract_citations_from_response(response_text, findings_context)

    return response_text, citations

def _extract_citations_from_response(response_text: str, findings_context: str) -> List[Dict]:
    """Extract and deduplicate citation references from Claude's response"""
    import re
    citations = []
    seen = set()

    # [Citation: ICH E6(R2) §6.9.4] or [Citation: FDA 21 CFR §312.23(a)]
    for m in re.findall(r'\[Citation:\s*([^\]]+)\]', response_text):
        key = m.strip()
        if key not in seen:
            seen.add(key)
            citations.append({"type": "regulatory", "reference": key, "text": f"Regulatory requirement: {key}"})

    # [Section 4.2] or [§4.8.1]
    for m in re.findall(r'\[(?:Section\s+)?§?(\d+(?:\.\d+)*)\]', response_text):
        key = f"Section {m}"
        if key not in seen:
            seen.add(key)
            citations.append({"type": "section", "reference": key, "text": f"Document {key}"})

    return citations[:15]

def _get_fallback_response(message: str, doc: Dict, findings: List[Dict]) -> str:
    """Fallback response when Claude is unavailable"""
    q = message.lower()
    doc_name = doc.get("name", "the document")
    
    if any(k in q for k in ["critical", "urgent", "serious"]):
        critical = [f for f in findings if str(f.get('severity', '')).lower() == 'critical']
        if critical:
            resp = f"Found **{len(critical)} critical finding(s)** in '{doc_name}':\n\n"
            for i, f in enumerate(critical[:3], 1):
                resp += f"{i}. **{f.get('title')}** ({f.get('section', 'N/A')})\n"
            return resp
        return f"No critical findings found in '{doc_name}'."
    
    elif any(k in q for k in ["summar", "overview"]):
        critical = len([f for f in findings if str(f.get('severity', '')).lower() == 'critical'])
        major = len([f for f in findings if str(f.get('severity', '')).lower() == 'major'])
        minor = len([f for f in findings if str(f.get('severity', '')).lower() == 'minor'])
        score = doc.get('compliance_score', 'N/A')
        return f"**Summary for '{doc_name}'**:\n\n• Compliance Score: {score}%\n• Critical: {critical}\n• Major: {major}\n• Minor: {minor}\n• Total Findings: {len(findings)}"
    
    elif any(k in q for k in ["score", "complian"]):
        score = doc.get('compliance_score', 'N/A')
        return f"The compliance score for '{doc_name}' is **{score}%**."
    
    else:
        return f"I can help you understand the compliance analysis for '{doc_name}'. Ask me about critical findings, compliance score, specific sections, or suggested fixes."

def _get_fallback_sources(findings: List[Dict]) -> List[Dict]:
    """Generate fallback sources from findings"""
    sources = []
    for f in findings[:3]:
        if f.get('citation'):
            sources.append({
                "type": "regulatory",
                "reference": f.get('citation', ''),
                "text": f.get('title', '')
            })
    return sources
import requests

# Add this near the top with other imports

# ── Reports ───────────────────────────────────────────────────────────────────
@app.post("/api/v1/reports/export")
async def export_report(document_id: str, format: str = "pdf", user_id: str = Depends(get_current_user_id)):
    doc_name = documents_db.get(document_id, {}).get("name", "Unknown")
    record_action(user_id, "exported", doc_name, document_id)
    return {"report_url": f"https://s3.amazonaws.com/reports/{document_id}.{format}",
            "expires_at": datetime.now() + timedelta(days=7), "format": format}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
