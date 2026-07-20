import uuid
from sqlalchemy import Column, String, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient_type = Column(String(20), nullable=False)  # donor|volunteer|recipient
    recipient_ref_id = Column(UUID(as_uuid=True), nullable=False)
    trigger_event = Column(String(50), nullable=False)
    channel = Column(String(10), nullable=False)  # email|sms
    recipient_email = Column(String(255))
    status = Column(String(10), nullable=False, default="pending")
    sent_at = Column(DateTime(timezone=True))
