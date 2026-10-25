
from fastapi.testclient import TestClient
from app import app

def test_homepage():
    with TestClient(app) as client:
        response = client.get("/")

        assert response.status_code == 200
        assert response.json() == {
            "message": "Car Dealership API"
        }
