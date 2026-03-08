from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import NullPool
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - use environment variable or default to local PostgreSQL
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:password@localhost:5432/regulatory_compliance"
)

# For AWS RDS Aurora PostgreSQL, use:
# DATABASE_URL = "postgresql://username:password@aurora-cluster-endpoint:5432/regulatory_compliance"

# Create engine
engine = create_engine(
    DATABASE_URL,
    poolclass=NullPool,  # For serverless/Lambda, use NullPool
    echo=True  # Set to False in production
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
