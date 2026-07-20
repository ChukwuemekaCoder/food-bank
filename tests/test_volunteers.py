VOLUNTEER = {"name": "Jane Driver", "email": "jane@example.com", "can_drive": True}


def test_create_volunteer(client):
    res = client.post("/volunteers", json=VOLUNTEER)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Jane Driver"
    assert data["can_drive"] is True
    assert "volunteer_id" in data


def test_list_volunteers(client):
    client.post("/volunteers", json=VOLUNTEER)
    res = client.get("/volunteers")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_volunteer(client):
    volunteer_id = client.post("/volunteers", json=VOLUNTEER).json()["volunteer_id"]
    res = client.get(f"/volunteers/{volunteer_id}")
    assert res.status_code == 200
    assert res.json()["volunteer_id"] == volunteer_id


def test_get_volunteer_not_found(client):
    res = client.get("/volunteers/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404
