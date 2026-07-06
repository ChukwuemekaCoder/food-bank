import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.inventory import InventoryItem
from app.schemas.inventory_item import InventoryItemCreate, InventoryItemResponse

router = APIRouter(
    prefix="/inventory-items",
    tags=["inventory"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=InventoryItemResponse, status_code=status.HTTP_201_CREATED)
def create_inventory_item(payload: InventoryItemCreate, db: Session = Depends(get_db)):
    item = InventoryItem(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.get("", response_model=List[InventoryItemResponse])
def list_inventory_items(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(InventoryItem).offset(skip).limit(limit).all()


@router.get("/{item_id}", response_model=InventoryItemResponse)
def get_inventory_item(item_id: uuid.UUID, db: Session = Depends(get_db)):
    item = db.query(InventoryItem).filter(InventoryItem.item_id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return item
