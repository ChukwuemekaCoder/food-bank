import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.volunteer import Shift, ShiftAssignment, Volunteer
from app.schemas.shift import (
    ShiftAssignmentCreate,
    ShiftAssignmentResponse,
    ShiftCreate,
    ShiftResponse,
)

router = APIRouter(
    prefix="/shifts",
    tags=["shifts"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=ShiftResponse, status_code=status.HTTP_201_CREATED)
def create_shift(payload: ShiftCreate, db: Session = Depends(get_db)):
    shift = Shift(**payload.model_dump())
    db.add(shift)
    db.commit()
    db.refresh(shift)
    return shift


@router.get("", response_model=List[ShiftResponse])
def list_shifts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Shift).offset(skip).limit(limit).all()


@router.get("/{shift_id}", response_model=ShiftResponse)
def get_shift(shift_id: uuid.UUID, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return shift


@router.post(
    "/{shift_id}/assignments",
    response_model=ShiftAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
def assign_volunteer(
    shift_id: uuid.UUID, payload: ShiftAssignmentCreate, db: Session = Depends(get_db)
):
    shift = db.query(Shift).filter(Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    volunteer = db.query(Volunteer).filter(Volunteer.volunteer_id == payload.volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    assignment = ShiftAssignment(shift_id=shift_id, volunteer_id=payload.volunteer_id)
    try:
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Volunteer is already assigned to this shift")
    return assignment


@router.get("/{shift_id}/assignments", response_model=List[ShiftAssignmentResponse])
def list_shift_assignments(shift_id: uuid.UUID, db: Session = Depends(get_db)):
    shift = db.query(Shift).filter(Shift.shift_id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")
    return db.query(ShiftAssignment).filter(ShiftAssignment.shift_id == shift_id).all()
