import uuid
from datetime import date, time
from typing import Literal
from pydantic import BaseModel, ConfigDict


class ShiftBase(BaseModel):
    shift_date: date
    start_time: time
    end_time: time
    shift_type: Literal["sorting", "driving", "packing"]
    capacity: int = 1


class ShiftCreate(ShiftBase):
    pass


class ShiftResponse(ShiftBase):
    model_config = ConfigDict(from_attributes=True)
    shift_id: uuid.UUID


class ShiftAssignmentCreate(BaseModel):
    volunteer_id: uuid.UUID


class ShiftAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    assignment_id: uuid.UUID
    shift_id: uuid.UUID
    volunteer_id: uuid.UUID
    status: str
