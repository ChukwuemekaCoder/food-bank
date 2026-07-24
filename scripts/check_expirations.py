"""
Nightly inventory expiration check.

Run locally:  DATABASE_URL=... python -m scripts.check_expirations
Via cron:     0 6 * * * /path/to/venv/bin/python -m scripts.check_expirations
Future:       AWS EventBridge -> Lambda wrapping this same function
"""
import sys
import uuid
from datetime import date, datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import SessionLocal
from app.models.inventory import InventoryItem
from app.models.notification import Notification
from app.models.staff_user import StaffUser


def check_expirations(db: Session, check_date: date = None) -> dict:
    if check_date is None:
        check_date = date.today()

    expired_items = (
        db.query(InventoryItem)
        .filter(
            InventoryItem.expiration_date.isnot(None),
            InventoryItem.expiration_date <= check_date,
            InventoryItem.status != "expired",
        )
        .all()
    )

    if not expired_items:
        return {"expired_count": 0, "notification_status": "skipped"}

    for item in expired_items:
        item.status = "expired"
    db.commit()

    staff = db.query(StaffUser).filter(StaffUser.is_active.is_(True)).first()
    ref_id = staff.user_id if staff else uuid.UUID(int=0)

    lines = [
        f"  - {item.description or item.category} "
        f"({item.quantity} {item.unit}), expired {item.expiration_date}"
        for item in expired_items
    ]
    body = (
        f"{len(expired_items)} inventory item(s) marked expired as of {check_date}:\n\n"
        + "\n".join(lines)
    )

    notification = Notification(
        recipient_type="staff",
        recipient_ref_id=ref_id,
        trigger_event="inventory_expiration_check",
        channel="email",
        recipient_email=settings.sendgrid_from_email,
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)

    notification_status = "skipped"
    if settings.sendgrid_api_key and settings.sendgrid_from_email:
        try:
            message = Mail(
                from_email=settings.sendgrid_from_email,
                to_emails=settings.sendgrid_from_email,
                subject=f"[Food Bank] {len(expired_items)} item(s) expired",
                plain_text_content=body,
            )
            SendGridAPIClient(api_key=settings.sendgrid_api_key).send(message)
            notification.status = "sent"
            notification.sent_at = datetime.now(timezone.utc)
            notification_status = "sent"
        except Exception as exc:
            notification.status = "failed"
            notification_status = "failed"
            print(f"SendGrid error: {exc}", file=sys.stderr)
        db.commit()

    return {"expired_count": len(expired_items), "notification_status": notification_status}


if __name__ == "__main__":
    db = SessionLocal()
    try:
        result = check_expirations(db)
        print(result)
    finally:
        db.close()
