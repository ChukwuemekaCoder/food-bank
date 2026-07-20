import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict


class DonorReceiptBase(BaseModel):
    donation_id: uuid.UUID
    issue_date: date
    deductible_value: Decimal
    status: Literal["draft", "issued", "sent"] = "draft"


class DonorReceiptCreate(DonorReceiptBase):
    pass


class DonorReceiptResponse(DonorReceiptBase):
    model_config = ConfigDict(from_attributes=True)

    receipt_id: uuid.UUID
    created_at: datetime
