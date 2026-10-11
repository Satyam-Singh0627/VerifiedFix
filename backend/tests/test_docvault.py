import pytest

def get_auth_token(client, username, password):
    res = client.post("/api/auth/login", json={"username": username, "password": password})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_seeded_identities_login(client):
    """Verify all 4 deterministic demo accounts can authenticate successfully."""
    for user, pwd in [("alice", "Password123!"), ("bob", "Password123!"), ("carol", "Password123!"), ("admin", "Password123!")]:
        token = get_auth_token(client, user, pwd)
        assert token is not None

def test_alice_can_view_her_own_document(client):
    """Alice can view her own private document (ID 12)."""
    alice_token = get_auth_token(client, "alice", "Password123!")
    res = client.get("/api/documents/12", headers={"Authorization": f"Bearer {alice_token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == 12
    assert "Q3 Financial Strategy" in data["title"]

def test_bob_can_view_his_own_document(client):
    """Bob can view his own document (ID 13)."""
    bob_token = get_auth_token(client, "bob", "Password123!")
    res = client.get("/api/documents/13", headers={"Authorization": f"Bearer {bob_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == 13

def test_carol_can_view_shared_document(client):
    """Carol can view document 14 explicitly shared with her by Alice."""
    carol_token = get_auth_token(client, "carol", "Password123!")
    res = client.get("/api/documents/14", headers={"Authorization": f"Bearer {carol_token}"})
    assert res.status_code == 200
    assert res.json()["id"] == 14

def test_bob_cannot_delete_alice_document(client):
    """Bob is forbidden from deleting Alice's document."""
    bob_token = get_auth_token(client, "bob", "Password123!")
    res = client.delete("/api/documents/12", headers={"Authorization": f"Bearer {bob_token}"})
    assert res.status_code == 403

def test_bob_cannot_share_alice_document(client):
    """Bob is forbidden from sharing Alice's document."""
    bob_token = get_auth_token(client, "bob", "Password123!")
    res = client.post(
        "/api/documents/12/share",
        json={"shared_with_username": "carol", "permission": "read"},
        headers={"Authorization": f"Bearer {bob_token}"}
    )
    assert res.status_code == 403

def test_admin_retains_authorized_access(client):
    """Admin has administrative access to inspect documents."""
    admin_token = get_auth_token(client, "admin", "Password123!")
    res = client.get("/api/documents/12", headers={"Authorization": f"Bearer {admin_token}"})
    assert res.status_code == 200

def test_unauthenticated_request_is_rejected(client):
    """Unauthenticated access to documents is denied with 401."""
    res = client.get("/api/documents/12")
    assert res.status_code == 401
