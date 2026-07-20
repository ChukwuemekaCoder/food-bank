import uuid
from sqlalchemy import Column, String, Text, Numeric, Date, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Donor(Base):
    __tablename__ = "donors"

    donor_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    type = Column(String(20), nullable=False)  # individual|business|org
    email = Column(String(255))
    phone = Column(String(30))
    tax_id = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donations = relationship("Donation", back_populates="donor")


class Donation(Base):
    __tablename__ = "donations"

    donation_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.donor_id"), nullable=False)
    received_date = Column(Date, nullable=False)
    donation_type = Column(String(20), nullable=False)  # food|funds|goods
    estimated_value = Column(Numeric(10, 2))
    notes = Column(Text)

    donor = relationship("Donor", back_populates="donations")
    inventory_items = relationship("InventoryItem", back_populates="donation")
    receipts = relationship("DonorReceipt", back_populates="donation")


class DonorReceipt(Base):
    __tablename__ = "donor_receipts"

    receipt_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donation_id = Column(UUID(as_uuid=True), ForeignKey("donations.donation_id"), nullable=False)
    issue_date = Column(Date, nullable=False)
    deductible_value = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), nullable=False, default="draft")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    donation = relationship("Donation", back_populates="receipts")
