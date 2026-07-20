SHIFT = {
    "shift_date": "2026-07-15",
    "start_time": "09:00:00",
    "end_time": "13:00:00",
    "shift_type": "driving",
    "capacity": 3,
}
VOLUNTEER = {"name": "Jane Driver", "can_drive": True}


def test_create_shift(client):
    res = client.post("/shifts", json=SHIFT)
    assert res.status_code == 201
    data = res.json()
    assert data["shift_type"] == "driving"
    assert "shift_id" in data


def test_list_shifts(client):
    client.post("/shifts", json=SHIFT)
    res = client.get("/shifts")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_shift(client):
    shift_id = client.post("/shifts", json=SHIFT).json()["shift_id"]
    res = client.get(f"/shifts/{shift_id}")
    assert res.status_code == 200
    assert res.json()["shift_id"] == shift_id


def test_get_shift_not_found(client):
    res = client.get("/shifts/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_invalid_shift_type(client):
    res = client.post("/shifts", json={**SHIFT, "shift_type": "cooking"})
    assert res.status_code == 422


def test_assign_volunteer(client):
    shift_id = client.post("/shifts", json=SHIFT).json()["shift_id"]
    volunteer_id = client.post("/volunteers", json=VOLUNTEER).json()["volunteer_id"]

    res = client.post(f"/shifts/{shift_id}/assignments", json={"volunteer_id": volunteer_id})
    assert res.status_code == 201
    data = res.json()
    assert data["shift_id"] == shift_id
    assert data["volunteer_id"] == volunteer_id
    assert data["status"] == "confirmed"


def test_list_shift_assignments(client):
    shift_id = client.post("/shifts", json=SHIFT).json()["shift_id"]
    volunteer_id = client.post("/volunteers", json=VOLUNTEER).json()["volunteer_id"]
    client.post(f"/shifts/{shift_id}/assignments", json={"volunteer_id": volunteer_id})

    res = client.get(f"/shifts/{shift_id}/assignments")
    assert res.status_code == 200
    assert len(res.json()) == 1
    assert res.json()[0]["volunteer_id"] == volunteer_id


def test_duplicate_assignment_returns_409(client):
    shift_id = client.post("/shifts", json=SHIFT).json()["shift_id"]
    volunteer_id = client.post("/volunteers", json=VOLUNTEER).json()["volunteer_id"]
    payload = {"volunteer_id": volunteer_id}

    client.post(f"/shifts/{shift_id}/assignments", json=payload)
    res = client.post(f"/shifts/{shift_id}/assignments", json=payload)
    assert res.status_code == 409


def test_assign_nonexistent_volunteer(client):
    shift_id = client.post("/shifts", json=SHIFT).json()["shift_id"]
    res = client.post(
        f"/shifts/{shift_id}/assignments",
        json={"volunteer_id": "00000000-0000-0000-0000-000000000000"},
    )
    assert res.status_code == 404
