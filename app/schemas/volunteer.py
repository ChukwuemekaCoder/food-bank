import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict


class VolunteerBase(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    can_drive: bool = False
    certifications: Optional[str] = None
    active: bool = True


class VolunteerCreate(VolunteerBase):
    pass


class VolunteerResponse(VolunteerBase):
    model_config = ConfigDict(from_attributes=True)
    volunteer_id: uuid.UUID
