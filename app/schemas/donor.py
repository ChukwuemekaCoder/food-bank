import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class DonorBase(BaseModel):
    name: str
    type: Literal["individual", "business", "org"]
    email: Optional[str] = None
    phone: Optional[str] = None
    tax_id: Optional[str] = None


class DonorCreate(DonorBase):
    pass


class DonorResponse(DonorBase):
    model_config = ConfigDict(from_attributes=True)
    donor_id: uuid.UUID
    created_at: datetime


class DonationBase(BaseModel):
    donor_id: uuid.UUID
    received_date: date
    donation_type: Literal["food", "funds", "goods"]
    estimated_value: Optional[Decimal] = None
    notes: Optional[str] = None


class DonationCreate(DonationBase):
    pass


class DonationResponse(DonationBase):
    model_config = ConfigDict(from_attributes=True)
    donation_id: uuid.UUID
