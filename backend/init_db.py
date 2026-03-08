"""
Database initialization script
Run this to create all tables in the database
"""
from database import engine, Base
from models import (
    User, Document, DocumentChunk, RegulatoryClause,
    Finding, ComplianceJob, AuditLog, ChatHistory
)

def init_database():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")
    
    # Print created tables
    print("\nCreated tables:")
    for table in Base.metadata.sorted_tables:
        print(f"  - {table.name}")

if __name__ == "__main__":
    init_database()
