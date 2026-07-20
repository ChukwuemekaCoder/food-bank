ROUTE = {"route_date": "2026-07-20", "status": "planned"}
RECIPIENT = {"name": "Eastside Shelter"}
ITEM = {"category": "canned", "quantity": "100", "unit": "cans"}


def _setup(client):
    """Return (route_id, recipient_id, item_id) for tests that need the full chain."""
    route_id = client.post("/routes", json=ROUTE).json()["route_id"]
    recipient_id = client.post("/recipients", json=RECIPIENT).json()["recipient_id"]
    item_id = client.post("/inventory-items", json=ITEM).json()["item_id"]
    return route_id, recipient_id, item_id


def test_create_route(client):
    res = client.post("/routes", json=ROUTE)
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "planned"
    assert "route_id" in data


def test_list_routes(client):
    client.post("/routes", json=ROUTE)
    res = client.get("/routes")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_route(client):
    route_id = client.post("/routes", json=ROUTE).json()["route_id"]
    res = client.get(f"/routes/{route_id}")
    assert res.status_code == 200
    assert res.json()["route_id"] == route_id


def test_get_route_not_found(client):
    res = client.get("/routes/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_add_stop(client):
    route_id, recipient_id, _ = _setup(client)
    res = client.post(
        f"/routes/{route_id}/stops",
        json={"recipient_id": recipient_id, "sequence_number": 1},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["sequence_number"] == 1
    assert data["status"] == "pending"


def test_list_stops_ordered(client):
    route_id, recipient_id, _ = _setup(client)
    for seq in [3, 1, 2]:
        client.post(
            f"/routes/{route_id}/stops",
            json={"recipient_id": recipient_id, "sequence_number": seq},
        )
    res = client.get(f"/routes/{route_id}/stops")
    assert res.status_code == 200
    sequences = [s["sequence_number"] for s in res.json()]
    assert sequences == [1, 2, 3]


def test_duplicate_stop_sequence_returns_409(client):
    route_id, recipient_id, _ = _setup(client)
    payload = {"recipient_id": recipient_id, "sequence_number": 1}
    client.post(f"/routes/{route_id}/stops", json=payload)
    res = client.post(f"/routes/{route_id}/stops", json=payload)
    assert res.status_code == 409


def test_add_stop_item(client):
    route_id, recipient_id, item_id = _setup(client)
    stop_id = client.post(
        f"/routes/{route_id}/stops",
        json={"recipient_id": recipient_id, "sequence_number": 1},
    ).json()["stop_id"]

    res = client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "40"},
    )
    assert res.status_code == 201
    assert float(res.json()["quantity_delivered"]) == 40.0


def test_list_stop_items(client):
    route_id, recipient_id, item_id = _setup(client)
    stop_id = client.post(
        f"/routes/{route_id}/stops",
        json={"recipient_id": recipient_id, "sequence_number": 1},
    ).json()["stop_id"]
    client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "25"},
    )

    res = client.get(f"/routes/{route_id}/stops/{stop_id}/items")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_stop_item_over_allocation(client):
    route_id, recipient_id, item_id = _setup(client)
    stop_id = client.post(
        f"/routes/{route_id}/stops",
        json={"recipient_id": recipient_id, "sequence_number": 1},
    ).json()["stop_id"]

    # Allocate 80 of 100
    client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "80"},
    )
    # Try to allocate 30 more — only 20 remain
    res = client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "30"},
    )
    assert res.status_code == 422
    assert "available" in res.json()["detail"]
