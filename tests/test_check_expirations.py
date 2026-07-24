from datetime import date
from unittest.mock import MagicMock, patch

from app.models.inventory import InventoryItem
from app.models.notification import Notification
from scripts.check_expirations import check_expirations

PAST = date(2020, 1, 1)
FUTURE = date(2099, 1, 1)


def _item(db, expiration_date, status="available"):
    item = InventoryItem(
        category="canned",
        quantity=10,
        unit="cans",
        expiration_date=expiration_date,
        status=status,
    )
    db.add(item)
    db.commit()
    return item


def _mock_sg():
    m = MagicMock()
    m.return_value.send.return_value = MagicMock(status_code=202)
    return m


def test_no_expired_items(db):
    _item(db, expiration_date=FUTURE)
    result = check_expirations(db, check_date=date.today())
    assert result == {"expired_count": 0, "notification_status": "skipped"}


def test_marks_expired_and_sends_email(db):
    item = _item(db, expiration_date=PAST)
    with patch("scripts.check_expirations.SendGridAPIClient", _mock_sg()):
        result = check_expirations(db, check_date=date.today())
    db.refresh(item)
    assert item.status == "expired"
    assert result["expired_count"] == 1
    assert result["notification_status"] == "sent"
    n = db.query(Notification).first()
    assert n.status == "sent"
    assert n.sent_at is not None


def test_skips_already_expired(db):
    _item(db, expiration_date=PAST, status="expired")
    result = check_expirations(db, check_date=date.today())
    assert result["expired_count"] == 0


def test_sendgrid_failure_recorded(db):
    _item(db, expiration_date=PAST)
    mock_sg = MagicMock()
    mock_sg.return_value.send.side_effect = Exception("network error")
    with patch("scripts.check_expirations.SendGridAPIClient", mock_sg):
        result = check_expirations(db, check_date=date.today())
    assert result["notification_status"] == "failed"
    n = db.query(Notification).first()
    assert n.status == "failed"
