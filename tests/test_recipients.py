RECIPIENT = {"name": "Westside Food Pantry", "address": "123 Main St", "household_or_capacity": 80}


def test_create_recipient(client):
    res = client.post("/recipients", json=RECIPIENT)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Westside Food Pantry"
    assert "recipient_id" in data


def test_list_recipients(client):
    client.post("/recipients", json=RECIPIENT)
    res = client.get("/recipients")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_recipient(client):
    recipient_id = client.post("/recipients", json=RECIPIENT).json()["recipient_id"]
    res = client.get(f"/recipients/{recipient_id}")
    assert res.status_code == 200
    assert res.json()["recipient_id"] == recipient_id


def test_get_recipient_not_found(client):
    res = client.get("/recipients/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
