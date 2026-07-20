import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.volunteer import Volunteer
from app.schemas.volunteer import VolunteerCreate, VolunteerResponse

router = APIRouter(
    prefix="/volunteers",
    tags=["volunteers"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=VolunteerResponse, status_code=status.HTTP_201_CREATED)
def create_volunteer(payload: VolunteerCreate, db: Session = Depends(get_db)):
    volunteer = Volunteer(**payload.model_dump())
    db.add(volunteer)
    db.commit()
    db.refresh(volunteer)
    return volunteer


@router.get("", response_model=List[VolunteerResponse])
def list_volunteers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Volunteer).offset(skip).limit(limit).all()


@router.get("/{volunteer_id}", response_model=VolunteerResponse)
def get_volunteer(volunteer_id: uuid.UUID, db: Session = Depends(get_db)):
    volunteer = db.query(Volunteer).filter(Volunteer.volunteer_id == volunteer_id).first()
    if not volunteer:
        raise HTTPException(status_code=404, detail="Volunteer not found")
    return volunteer
