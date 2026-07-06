import uuid
from sqlalchemy import Column, String, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class InventoryItem(Base):
    __tablename__ = "inventory_items"

    item_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.donation_id"))
    category = Column(String(30), nullable=False)  # produce|canned|dairy|frozen|dry_goods|other
    description = Column(String(255))
    quantity = Column(Numeric(10, 2), nullable=False)
    unit = Column(String(20), nullable=False)
    expiration_date = Column(Date)
    storage_location = Column(String(100))
    status = Column(String(20), nullable=False, default="available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donation = relationship("Donation", back_populates="inventory_items")
    route_stop_items = relationship("RouteStopItem", back_populates="item")
