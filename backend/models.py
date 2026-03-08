from sqlalchemy import Column, String, Integer, DateTime, Text, Enum, ForeignKey, Float, Boolean, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
from database import Base
import enum

# Enums
class DocumentStatusEnum(str, enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"

class FindingSeverityEnum(str, enum.Enum):
    CRITICAL = "critical"
    MAJOR = "major"
    MINOR = "minor"

class FindingStatusEnum(str, enum.Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"

class ConfidenceLevelEnum(str, enum.Enum):
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class UserRoleEnum(str, enum.Enum):
    ADMIN = "admin"
    REVIEWER = "reviewer"
    VIEWER = "viewer"

# Models

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    organization = Column(String(255))
    role = Column(Enum(UserRoleEnum), default=UserRoleEnum.VIEWER)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    documents = relationship("Document", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False)
    original_filename = Column(String(500))
    s3_key = Column(String(1000))  # S3 object key
    file_size = Column(Integer)  # in bytes
    page_count = Column(Integer)
    status = Column(Enum(DocumentStatusEnum), default=DocumentStatusEnum.UPLOADED)
    guidelines = Column(ARRAY(String))  # Array of guideline names
    compliance_score = Column(Float)  # Overall compliance score (0-100)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    processed_at = Column(DateTime)
    
    # Relationships
    user = relationship("User", back_populates="documents")
    findings = relationship("Finding", back_populates="document", cascade="all, delete-orphan")
    chunks = relationship("DocumentChunk", back_populates="document", cascade="all, delete-orphan")
    compliance_jobs = relationship("ComplianceJob", back_populates="document")

class DocumentChunk(Base):
    __tablename__ = "document_chunks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    chunk_index = Column(Integer, nullable=False)  # Order of chunk in document
    section_name = Column(String(500))  # e.g., "4.2 Study Objectives"
    page_number = Column(Integer)
    text_content = Column(Text, nullable=False)
    token_count = Column(Integer)
    embedding = Column(ARRAY(Float))  # Vector embedding (1536 dimensions for Titan)
    meta_data = Column(JSON)  # Additional metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="chunks")

class RegulatoryClause(Base):
    __tablename__ = "regulatory_clauses"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    guideline_name = Column(String(255), nullable=False, index=True)  # e.g., "ICH E6(R2)"
    guideline_version = Column(String(50))
    section_number = Column(String(100))  # e.g., "6.9.4"
    section_title = Column(String(500))
    clause_text = Column(Text, nullable=False)
    page_number = Column(Integer)
    effective_date = Column(DateTime)
    embedding = Column(ARRAY(Float))  # Vector embedding
    meta_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    findings = relationship("Finding", back_populates="regulatory_clause")

class Finding(Base):
    __tablename__ = "findings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    regulatory_clause_id = Column(UUID(as_uuid=True), ForeignKey("regulatory_clauses.id"))
    severity = Column(Enum(FindingSeverityEnum), nullable=False, index=True)
    status = Column(Enum(FindingStatusEnum), default=FindingStatusEnum.PENDING, index=True)
    
    # Content
    section = Column(String(500))  # Document section where issue found
    title = Column(String(500), nullable=False)
    document_text = Column(Text)  # Excerpt from user document
    regulatory_text = Column(Text)  # Relevant regulatory requirement
    citation = Column(String(500))  # e.g., "ICH E6(R2) Section 6.9.4"
    gap_analysis = Column(Text)  # Explanation of the gap
    suggested_fix = Column(Text)  # AI-generated compliant text
    
    # Scoring
    confidence = Column(Enum(ConfidenceLevelEnum), default=ConfidenceLevelEnum.MEDIUM)
    similarity_score = Column(Float)  # Vector similarity score (0-1)
    
    # User feedback
    user_feedback = Column(String(50))  # "helpful", "not-helpful", "positive", "negative"
    feedback_comment = Column(Text)
    feedback_submitted_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="findings")
    regulatory_clause = relationship("RegulatoryClause", back_populates="findings")

class ComplianceJob(Base):
    __tablename__ = "compliance_jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    status = Column(String(50), default="pending")  # pending, running, completed, failed
    guidelines = Column(ARRAY(String))
    findings_count = Column(Integer, default=0)
    progress_percentage = Column(Integer, default=0)
    error_message = Column(Text)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("Document", back_populates="compliance_jobs")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(String(255), nullable=False, index=True)  # e.g., "Document Uploaded"
    resource_type = Column(String(100))  # e.g., "document", "finding"
    resource_id = Column(UUID(as_uuid=True))
    details = Column(JSON)  # Additional context
    ip_address = Column(String(45))
    user_agent = Column(String(500))
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")

class ChatHistory(Base):
    __tablename__ = "chat_history"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(50), nullable=False)  # "user" or "assistant"
    content = Column(Text, nullable=False)
    sources = Column(JSON)  # Citations and sources
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
