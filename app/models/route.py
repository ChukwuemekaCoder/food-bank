import uuid
from sqlalchemy import Column, String, Integer, Numeric, Date, Time, Text, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Recipient(Base):
    __tablename__ = "recipients"

    recipient_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    address = Column(String(255))
    contact_name = Column(String(255))
    phone = Column(String(30))
    household_or_capacity = Column(Integer)
    delivery_notes = Column(Text)

    stops = relationship("RouteStop", back_populates="recipient")


class Route(Base):
    __tablename__ = "routes"

    route_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.shift_id"))
    route_date = Column(Date, nullable=False)
    status = Column(String(20), nullable=False, default="planned")
    vehicle = Column(String(100))

    shift = relationship("Shift", back_populates="routes")
    stops = relationship("RouteStop", back_populates="route", order_by="RouteStop.sequence_number")


class RouteStop(Base):
    __tablename__ = "route_stops"
    __table_args__ = (UniqueConstraint("route_id", "sequence_number"),)

    stop_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    route_id = Column(UUID(as_uuid=True), ForeignKey("routes.route_id"), nullable=False)
    recipient_id = Column(UUID(as_uuid=True), ForeignKey("recipients.recipient_id"), nullable=False)
    sequence_number = Column(Integer, nullable=False)
    estimated_arrival = Column(Time)
    status = Column(String(20), nullable=False, default="pending")

    route = relationship("Route", back_populates="stops")
    recipient = relationship("Recipient", back_populates="stops")
    items = relationship("RouteStopItem", back_populates="stop")


class RouteStopItem(Base):
    __tablename__ = "route_stop_items"

    route_stop_item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    stop_id = Column(UUID(as_uuid=True), ForeignKey("route_stops.stop_id"), nullable=False)
    item_id = Column(UUID(as_uuid=True), ForeignKey("inventory_items.item_id"), nullable=False)
    quantity_delivered = Column(Numeric(10, 2), nullable=False)

    stop = relationship("RouteStop", back_populates="items")
    item = relationship("InventoryItem", back_populates="route_stop_items")
