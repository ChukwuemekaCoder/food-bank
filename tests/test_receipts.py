DONOR = {"name": "ACME Corp", "type": "business"}
DONATION = {"received_date": "2026-07-01", "donation_type": "food"}


def _make_donation(client):
    donor_id = client.post("/donors", json=DONOR).json()["donor_id"]
    body = {**DONATION, "donor_id": donor_id}
    return client.post(f"/donors/{donor_id}/donations", json=body).json()["donation_id"]


def _receipt_payload(donation_id):
    return {"donation_id": donation_id, "issue_date": "2026-07-19", "deductible_value": "150.00"}


def test_create_receipt(client):
    donation_id = _make_donation(client)
    res = client.post("/receipts", json=_receipt_payload(donation_id))
    assert res.status_code == 201
    data = res.json()
    assert "receipt_id" in data
    assert data["status"] == "draft"
    assert float(data["deductible_value"]) == 150.0


def test_list_receipts(client):
    donation_id = _make_donation(client)
    client.post("/receipts", json=_receipt_payload(donation_id))
    res = client.get("/receipts")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_receipt(client):
    donation_id = _make_donation(client)
    receipt_id = client.post("/receipts", json=_receipt_payload(donation_id)).json()["receipt_id"]
    res = client.get(f"/receipts/{receipt_id}")
    assert res.status_code == 200
    assert res.json()["receipt_id"] == receipt_id


def test_get_receipt_not_found(client):
    res = client.get("/receipts/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_invalid_donation_id(client):
    payload = {**_receipt_payload("00000000-0000-0000-0000-000000000000")}
    res = client.post("/receipts", json=payload)
    assert res.status_code == 404


def test_invalid_status(client):
    donation_id = _make_donation(client)
    payload = {**_receipt_payload(donation_id), "status": "voided"}
    res = client.post("/receipts", json=payload)
    assert res.status_code == 422


def test_explicit_status_issued(client):
    donation_id = _make_donation(client)
    payload = {**_receipt_payload(donation_id), "status": "issued"}
    res = client.post("/receipts", json=payload)
    assert res.status_code == 201
    assert res.json()["status"] == "issued"
