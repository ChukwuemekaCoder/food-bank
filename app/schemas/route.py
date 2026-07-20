import uuid
from datetime import date, time
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict


class RouteBase(BaseModel):
    route_date: date
    shift_id: Optional[uuid.UUID] = None
    status: str = "planned"
    vehicle: Optional[str] = None


class RouteCreate(RouteBase):
    pass


class RouteResponse(RouteBase):
    model_config = ConfigDict(from_attributes=True)
    route_id: uuid.UUID


class RouteStopCreate(BaseModel):
    recipient_id: uuid.UUID
    sequence_number: int
    estimated_arrival: Optional[time] = None


class RouteStopResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    stop_id: uuid.UUID
    route_id: uuid.UUID
    recipient_id: uuid.UUID
    sequence_number: int
    estimated_arrival: Optional[time] = None
    status: str


class RouteStopItemCreate(BaseModel):
    item_id: uuid.UUID
    quantity_delivered: Decimal


class RouteStopItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    route_stop_item_id: uuid.UUID
    stop_id: uuid.UUID
    item_id: uuid.UUID
    quantity_delivered: Decimal
