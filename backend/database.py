from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os

# In production: load from environment variable
# DATABASE_URL = os.getenv("DATABASE_URL")
# For local dev we use SQLite so you can run this without PostgreSQL installed
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./urls.db")

engine = create_engine(
    DATABASE_URL,
    # SQLite-specific arg — remove this line when switching to PostgreSQL
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
