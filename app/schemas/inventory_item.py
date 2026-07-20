import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Literal, Optional
from pydantic import BaseModel, ConfigDict


class InventoryItemBase(BaseModel):
    donation_id: Optional[uuid.UUID] = None
    category: Literal["produce", "canned", "dairy", "frozen", "dry_goods", "other"]
    description: Optional[str] = None
    quantity: Decimal
    unit: str
    expiration_date: Optional[date] = None
    storage_location: Optional[str] = None
    status: str = "available"


class InventoryItemCreate(InventoryItemBase):
    pass


class InventoryItemResponse(InventoryItemBase):
    model_config = ConfigDict(from_attributes=True)
    item_id: uuid.UUID
    created_at: datetime
