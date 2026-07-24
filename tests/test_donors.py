DONOR = {"name": "ACME Corp", "type": "business"}
DONATION = {"received_date": "2026-07-01", "donation_type": "food"}


def test_create_donor(client):
    res = client.post("/donors", json=DONOR)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "ACME Corp"
    assert data["type"] == "business"
    assert "donor_id" in data


def test_list_donors(client):
    client.post("/donors", json=DONOR)
    res = client.get("/donors")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_get_donor(client):
    donor_id = client.post("/donors", json=DONOR).json()["donor_id"]
    res = client.get(f"/donors/{donor_id}")
    assert res.status_code == 200
    assert res.json()["donor_id"] == donor_id


def test_get_donor_not_found(client):
    res = client.get("/donors/00000000-0000-0000-0000-000000000000")
    assert res.status_code == 404


def test_donor_invalid_type(client):
    res = client.post("/donors", json={**DONOR, "type": "nonprofit"})
    assert res.status_code == 422


def test_create_donation(client):
    donor_id = client.post("/donors", json=DONOR).json()["donor_id"]
    res = client.post(f"/donors/{donor_id}/donations", json={**DONATION, "donor_id": donor_id})
    assert res.status_code == 201
    assert res.json()["donation_type"] == "food"


def test_list_donations(client):
    donor_id = client.post("/donors", json=DONOR).json()["donor_id"]
    client.post(f"/donors/{donor_id}/donations", json={**DONATION, "donor_id": donor_id})
    res = client.get(f"/donors/{donor_id}/donations")
    assert res.status_code == 200
    assert len(res.json()) == 1


def test_list_donations_donor_not_found(client):
    res = client.get("/donors/00000000-0000-0000-0000-000000000000/donations")
    assert res.status_code == 404


def test_donation_invalid_type(client):
    donor_id = client.post("/donors", json=DONOR).json()["donor_id"]
    res = client.post(
        f"/donors/{donor_id}/donations",
        json={**DONATION, "donor_id": donor_id, "donation_type": "crypto"},
    )
    assert res.status_code == 422
