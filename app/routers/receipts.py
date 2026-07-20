import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.donor import Donation, DonorReceipt
from app.schemas.donor_receipt import DonorReceiptCreate, DonorReceiptResponse

router = APIRouter(prefix="/receipts", tags=["receipts"], dependencies=[Depends(get_current_user)])


@router.post("", response_model=DonorReceiptResponse, status_code=status.HTTP_201_CREATED)
def create_receipt(payload: DonorReceiptCreate, db: Session = Depends(get_db)):
    donation = db.query(Donation).filter(Donation.donation_id == payload.donation_id).first()
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")

    receipt = DonorReceipt(**payload.model_dump())
    db.add(receipt)
    db.commit()
    db.refresh(receipt)
    return receipt


@router.get("", response_model=List[DonorReceiptResponse])
def list_receipts(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(DonorReceipt).offset(skip).limit(limit).all()


@router.get("/{receipt_id}", response_model=DonorReceiptResponse)
def get_receipt(receipt_id: uuid.UUID, db: Session = Depends(get_db)):
    receipt = db.query(DonorReceipt).filter(DonorReceipt.receipt_id == receipt_id).first()
    if not receipt:
        raise HTTPException(status_code=404, detail="Receipt not found")
    return receipt
