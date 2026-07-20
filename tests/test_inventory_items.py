ITEM = {"category": "canned", "quantity": "50", "unit": "cans", "description": "Chickpeas"}


def test_create_inventory_item(client):
    res = client.post("/inventory-items", json=ITEM)
    assert res.status_code == 201
    data = res.json()
    assert data["category"] == "canned"
    assert "item_id" in data


def test_list_inventory_items(client):
    client.post("/inventory-items", json=ITEM)
    res = client.get("/inventory-items")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_inventory_item(client):
    item_id = client.post("/inventory-items", json=ITEM).json()["item_id"]
    res = client.get(f"/inventory-items/{item_id}")
    assert res.status_code == 200
    assert res.json()["item_id"] == item_id


def test_get_inventory_item_not_found(client):
    res = client.get("/inventory-items/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_invalid_category(client):
    res = client.post("/inventory-items", json={**ITEM, "category": "beverages"})
    assert res.status_code == 422


def _make_route_stop(client):
    """Helper: create the minimal chain needed to attach a stop item."""
    recipient_id = client.post("/recipients", json={"name": "Pantry A"}).json()["recipient_id"]
    route_id = client.post(
        "/routes", json={"route_date": "2026-08-01", "status": "planned"}
    ).json()["route_id"]
    stop_id = client.post(
        f"/routes/{route_id}/stops",
        json={"recipient_id": recipient_id, "sequence_number": 1},
    ).json()["stop_id"]
    return route_id, stop_id


def test_over_allocation_rejected(client):
    item_id = client.post("/inventory-items", json=ITEM).json()["item_id"]
    route_id, stop_id = _make_route_stop(client)

    # Allocate 40 of 50
    r = client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "40"},
    )
    assert r.status_code == 201

    # Try to allocate 20 more — only 10 remain
    r = client.post(
        f"/routes/{route_id}/stops/{stop_id}/items",
        json={"item_id": item_id, "quantity_delivered": "20"},
    )
    assert r.status_code == 422
    assert "available" in r.json()["detail"]
