from sqlalchemy import Column, String, Integer, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class URL(Base):
    """
    Stores every shortened URL.
    - short_code: the 6-char random key (or custom alias)
    - original_url: the full destination URL
    - click_count: denormalized counter (faster reads than COUNT(*) on clicks table)
    - created_at: when it was created
    """
    __tablename__ = "urls"

    short_code  = Column(String(50), primary_key=True, index=True)
    original_url = Column(Text, nullable=False)
    click_count  = Column(Integer, default=0)
    created_at   = Column(DateTime, default=datetime.utcnow)


class Click(Base):
    """
    Every redirect is logged here for analytics.
    - ip_address: for geo-analytics (you'd add MaxMind later)
    - user_agent: to detect device type (mobile/desktop/bot)
    - timestamp: for time-series charts
    """
    __tablename__ = "clicks"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    short_code  = Column(String(50), index=True)
    ip_address  = Column(String(50))
    user_agent  = Column(Text)
    timestamp   = Column(DateTime, default=datetime.utcnow)
