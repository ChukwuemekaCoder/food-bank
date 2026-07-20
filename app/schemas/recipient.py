import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RecipientBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    household_or_capacity: Optional[int] = None
    delivery_notes: Optional[str] = None


class RecipientCreate(RecipientBase):
    pass


class RecipientResponse(RecipientBase):
    model_config = ConfigDict(from_attributes=True)
    recipient_id: uuid.UUID
