import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.db.database import get_db
from app.models.inventory import InventoryItem
from app.models.route import Recipient, Route, RouteStop, RouteStopItem
from app.schemas.route import (
    RouteCreate,
    RouteResponse,
    RouteStopCreate,
    RouteStopItemCreate,
    RouteStopItemResponse,
    RouteStopResponse,
)

router = APIRouter(
    prefix="/routes",
    tags=["routes"],
    dependencies=[Depends(get_current_user)],
)


@router.post("", response_model=RouteResponse, status_code=status.HTTP_201_CREATED)
def create_route(payload: RouteCreate, db: Session = Depends(get_db)):
    route = Route(**payload.model_dump())
    db.add(route)
    db.commit()
    db.refresh(route)
    return route


@router.get("", response_model=List[RouteResponse])
def list_routes(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    return db.query(Route).offset(skip).limit(limit).all()


@router.get("/{route_id}", response_model=RouteResponse)
def get_route(route_id: uuid.UUID, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.route_id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return route


@router.post(
    "/{route_id}/stops",
    response_model=RouteStopResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_stop(route_id: uuid.UUID, payload: RouteStopCreate, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.route_id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")

    recipient = db.query(Recipient).filter(Recipient.recipient_id == payload.recipient_id).first()
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")

    stop = RouteStop(route_id=route_id, **payload.model_dump())
    try:
        db.add(stop)
        db.commit()
        db.refresh(stop)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=f"sequence_number {payload.sequence_number} is already used on this route",
        )
    return stop


@router.get("/{route_id}/stops", response_model=List[RouteStopResponse])
def list_stops(route_id: uuid.UUID, db: Session = Depends(get_db)):
    route = db.query(Route).filter(Route.route_id == route_id).first()
    if not route:
        raise HTTPException(status_code=404, detail="Route not found")
    return (
        db.query(RouteStop)
        .filter(RouteStop.route_id == route_id)
        .order_by(RouteStop.sequence_number)
        .all()
    )


@router.post(
    "/{route_id}/stops/{stop_id}/items",
    response_model=RouteStopItemResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_stop_item(
    route_id: uuid.UUID,
    stop_id: uuid.UUID,
    payload: RouteStopItemCreate,
    db: Session = Depends(get_db),
):
    stop = db.query(RouteStop).filter(
        RouteStop.stop_id == stop_id,
        RouteStop.route_id == route_id,
    ).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found on this route")

    item = db.query(InventoryItem).filter(InventoryItem.item_id == payload.item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    already_allocated = (
        db.query(func.sum(RouteStopItem.quantity_delivered))
        .filter(RouteStopItem.item_id == payload.item_id)
        .scalar() or 0
    )
    available = item.quantity - already_allocated
    if payload.quantity_delivered > available:
        raise HTTPException(
            status_code=422,
            detail=(
                f"Only {available} {item.unit} available "
                f"(batch has {item.quantity}, {already_allocated} already allocated)"
            ),
        )

    stop_item = RouteStopItem(stop_id=stop_id, **payload.model_dump())
    db.add(stop_item)
    db.commit()
    db.refresh(stop_item)
    return stop_item


@router.get("/{route_id}/stops/{stop_id}/items", response_model=List[RouteStopItemResponse])
def list_stop_items(
    route_id: uuid.UUID, stop_id: uuid.UUID, db: Session = Depends(get_db)
):
    stop = db.query(RouteStop).filter(
        RouteStop.stop_id == stop_id,
        RouteStop.route_id == route_id,
    ).first()
    if not stop:
        raise HTTPException(status_code=404, detail="Stop not found on this route")
    return db.query(RouteStopItem).filter(RouteStopItem.stop_id == stop_id).all()
