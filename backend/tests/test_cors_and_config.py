import pytest

def test_cors_preflight_vercel_production_origin(client):
    """CORS preflight request from exact Vercel production origin must be allowed."""
    headers = {
        "Origin": "https://verified-fix-six.vercel.app",
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization, Content-Type",
    }
    res = client.options("/api/system/stats", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "https://verified-fix-six.vercel.app"
    assert res.headers.get("access-control-allow-credentials") == "true"

def test_cors_preflight_localhost_origin(client):
    """CORS preflight request from local dev origin must be allowed."""
    headers = {
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
    }
    res = client.options("/api/system/reset-demo", headers=headers)
    assert res.status_code == 200
    assert res.headers.get("access-control-allow-origin") == "http://localhost:5173"

def test_cors_disallows_untrusted_origin(client):
    """CORS preflight request from untrusted origin must not be allowed."""
    headers = {
        "Origin": "https://malicious-attacker.com",
        "Access-Control-Request-Method": "GET",
    }
    res = client.options("/api/system/stats", headers=headers)
    assert res.headers.get("access-control-allow-origin") is None
