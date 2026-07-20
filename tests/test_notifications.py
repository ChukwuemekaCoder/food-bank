import uuid
from unittest.mock import MagicMock, patch

NOTIFICATION = {
    "recipient_type": "donor",
    "recipient_ref_id": str(uuid.uuid4()),
    "trigger_event": "donation_received",
    "channel": "email",
}


def test_create_notification(client):
    res = client.post("/notifications", json=NOTIFICATION)
    assert res.status_code == 201
    data = res.json()
    assert data["recipient_type"] == "donor"
    assert data["channel"] == "email"
    assert data["status"] == "pending"
    assert "notification_id" in data


def test_list_notifications(client):
    client.post("/notifications", json=NOTIFICATION)
    res = client.get("/notifications")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_notification(client):
    notification_id = client.post("/notifications", json=NOTIFICATION).json()["notification_id"]
    res = client.get(f"/notifications/{notification_id}")
    assert res.status_code == 200
    assert res.json()["notification_id"] == notification_id


def test_get_notification_not_found(client):
    res = client.get("/notifications/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_invalid_recipient_type(client):
    res = client.post("/notifications", json={**NOTIFICATION, "recipient_type": "employee"})
    assert res.status_code == 422


def test_invalid_channel(client):
    res = client.post("/notifications", json={**NOTIFICATION, "channel": "fax"})
    assert res.status_code == 422


EMAIL_WITH_ADDRESS = {
    **NOTIFICATION,
    "recipient_email": "donor@example.com",
}


def test_email_sent_successfully(client):
    mock_response = MagicMock()
    mock_response.status_code = 202
    with patch("app.routers.notifications.SendGridAPIClient") as MockSG:
        MockSG.return_value.send.return_value = mock_response
        res = client.post("/notifications", json=EMAIL_WITH_ADDRESS)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "sent"
    assert data["sent_at"] is not None


def test_email_send_failure_does_not_crash(client):
    with patch("app.routers.notifications.SendGridAPIClient") as MockSG:
        MockSG.return_value.send.side_effect = Exception("SendGrid error")
        res = client.post("/notifications", json=EMAIL_WITH_ADDRESS)
    assert res.status_code == 201
    assert res.json()["status"] == "failed"


def test_sms_stays_pending(client):
    payload = {**NOTIFICATION, "channel": "sms", "recipient_email": None}
    res = client.post("/notifications", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "pending"
