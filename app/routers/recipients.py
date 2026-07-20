import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.route import Recipient
from app.schemas.recipient import RecipientCreate, RecipientResponse

router = APIRouter(
    prefix="/recipients",
    tags=["recipients"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=RecipientResponse, status_code=status.HTTP_201_CREATED)
def create_recipient(payload: RecipientCreate, db: Session = Depends(get_db)):
    recipient = Recipient(**payload.model_dump())
    db.add(recipient)
    db.commit()
    db.refresh(recipient)
    return recipient


@router.get("", response_model=List[RecipientResponse])
def list_recipients(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Recipient).offset(skip).limit(limit).all()


@router.get("/{recipient_id}", response_model=RecipientResponse)
def get_recipient(recipient_id: uuid.UUID, db: Session = Depends(get_db)):
    recipient = db.query(Recipient).filter(Recipient.recipient_id == recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient
