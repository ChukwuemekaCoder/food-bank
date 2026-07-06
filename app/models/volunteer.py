import uuid
from sqlalchemy import Column, String, Boolean, Integer, Date, Time, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.db.database import Base


class Volunteer(Base):
    __tablename__ = "volunteers"

    volunteer_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(30))
    can_drive = Column(Boolean, nullable=False, default=False)
    certifications = Column(String(255))
    active = Column(Boolean, nullable=False, default=True)

    assignments = relationship("ShiftAssignment", back_populates="volunteer")


class Shift(Base):
    __tablename__ = "shifts"

    shift_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    shift_type = Column(String(20), nullable=False)  # sorting|driving|packing
    capacity = Column(Integer, nullable=False, default=1)

    assignments = relationship("ShiftAssignment", back_populates="shift")
    routes = relationship("Route", back_populates="shift")


class ShiftAssignment(Base):
    __tablename__ = "shift_assignments"
    __table_args__ = (UniqueConstraint("shift_id", "volunteer_id"),)

    assignment_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shift_id = Column(UUID(as_uuid=True), ForeignKey("shifts.shift_id"), nullable=False)
    volunteer_id = Column(UUID(as_uuid=True), ForeignKey("volunteers.volunteer_id"), nullable=False)
    status = Column(String(20), nullable=False, default="confirmed")

    shift = relationship("Shift", back_populates="assignments")
    volunteer = relationship("Volunteer", back_populates="assignments")
