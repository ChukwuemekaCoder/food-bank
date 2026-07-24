import uuid
from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict, EmailStr


class NotificationBase(BaseModel):
    recipient_type: Literal["donor", "volunteer", "recipient", "staff"]
    recipient_ref_id: uuid.UUID
    trigger_event: str
    channel: Literal["email", "sms"]
    recipient_email: Optional[EmailStr] = None
    status: Literal["pending", "sent", "failed"] = "pending"
    sent_at: Optional[datetime] = None


class NotificationCreate(NotificationBase):
    pass


class NotificationResponse(NotificationBase):
    model_config = ConfigDict(from_attributes=True)
    notification_id: uuid.UUID
