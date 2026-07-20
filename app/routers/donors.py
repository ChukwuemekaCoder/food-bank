import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.donor import Donor, Donation
from app.schemas.donor import DonorCreate, DonorResponse, DonationCreate, DonationResponse

router = APIRouter(prefix="/donors", tags=["donors"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=DonorResponse, status_code=status.HTTP_201_CREATED)
def create_donor(payload: DonorCreate, db: Session = Depends(get_db)):
    donor = Donor(**payload.model_dump())
    db.add(donor)
    db.commit()
    db.refresh(donor)
    return donor


@router.get("", response_model=List[DonorResponse])
def list_donors(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Donor).offset(skip).limit(limit).all()


@router.get("/{donor_id}", response_model=DonorResponse)
def get_donor(donor_id: uuid.UUID, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return donor


@router.post("/{donor_id}/donations", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
def create_donation(donor_id: uuid.UUID, payload: DonationCreate, db: Session = Depends(get_db)):
    donor = db.query(Donor).filter(Donor.donor_id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    donation = Donation(**payload.model_dump())
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


@router.get("/{donor_id}/donations", response_model=List[DonationResponse])
def list_donor_donations(donor_id: uuid.UUID, db: Session = Depends(get_db)):
    return db.query(Donation).filter(Donation.donor_id == donor_id).all()
