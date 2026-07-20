import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationResponse

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
def create_notification(payload: NotificationCreate, db: Session = Depends(get_db)):
    notification = Notification(**payload.model_dump())
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


@router.get("", response_model=List[NotificationResponse])
def list_notifications(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Notification).offset(skip).limit(limit).all()


@router.get("/{notification_id}", response_model=NotificationResponse)
def get_notification(notification_id: uuid.UUID, db: Session = Depends(get_db)):
    notification = db.query(Notification).filter(
        Notification.notification_id == notification_id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notification
