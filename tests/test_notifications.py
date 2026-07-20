import uuid

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
