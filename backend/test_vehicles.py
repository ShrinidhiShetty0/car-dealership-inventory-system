
import uuid

from fastapi.testclient import TestClient

from app import app


def register_and_login(client, role="user"):
    """Create a test account and return its JWT token."""
    unique = uuid.uuid4().hex[:10]

    username = f"test_{unique}"
    email = f"{username}@example.com"
    password = "TestPass123!"

    response = client.post(
        "/api/auth/register",
        json={
            "username": username,
            "email": email,
            "password": password,
        },
    )

    assert response.status_code == 201, response.text

    # Registration always creates a regular user.
    if role == "admin":
        # Promote this test account directly in the test database.
        from database import get_db
        from models import User

        db_generator = get_db()
        db = next(db_generator)

        try:
            user = db.query(User).filter(
                User.username == username
            ).first()

            assert user is not None
            user.role = "admin"
            db.commit()
        finally:
            db.close()

    login_response = client.post(
        "/api/auth/login",
        json={
            "username": username,
            "password": password,
        },
    )

    assert login_response.status_code == 200, login_response.text

    token = login_response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_vehicles():
    """Authenticated users can list vehicles."""
    with TestClient(app) as client:
        headers = register_and_login(client)

        response = client.get(
            "/api/vehicles",
            headers=headers,
        )

        assert response.status_code == 200
        assert isinstance(response.json(), list)


def test_list_vehicles_requires_login():
    """Unauthenticated requests are rejected."""
    with TestClient(app) as client:
        response = client.get("/api/vehicles")

        assert response.status_code == 401


def test_add_vehicle():
    """Administrators can add vehicles."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "TestToyota",
                "model": "TestCamry",
                "category": "Sedan",
                "price": 25000,
                "quantity": 5,
            },
        )

        assert response.status_code == 201, response.text

        data = response.json()
        assert data["id"] is not None
        assert data["make"] == "TestToyota"
        assert data["model"] == "TestCamry"
        assert data["category"] == "Sedan"
        assert data["price"] == 25000
        assert data["quantity"] == 5


def test_regular_user_cannot_add_vehicle():
    """Regular users cannot add inventory."""
    with TestClient(app) as client:
        headers = register_and_login(client)

        response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "TestHonda",
                "model": "TestCity",
                "category": "Sedan",
                "price": 18000,
                "quantity": 3,
            },
        )

        assert response.status_code == 403


def test_add_vehicle_rejects_invalid_price():
    """A zero price is rejected after authorization."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "TestToyota",
                "model": "TestCamry",
                "category": "Sedan",
                "price": 0,
                "quantity": 5,
            },
        )

        assert response.status_code == 422


def test_add_vehicle_rejects_negative_quantity():
    """Negative stock quantity is rejected."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "TestHonda",
                "model": "TestCity",
                "category": "Sedan",
                "price": 18000,
                "quantity": -1,
            },
        )

        assert response.status_code == 422


def test_search_vehicle_by_make():
    """Authenticated users can search by make."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        create_response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "SearchHonda",
                "model": "SearchCity",
                "category": "Sedan",
                "price": 18000,
                "quantity": 3,
            },
        )

        assert create_response.status_code == 201

        user_headers = register_and_login(client)

        response = client.get(
            "/api/vehicles/search",
            headers=user_headers,
            params={"make": "SearchHonda"},
        )

        assert response.status_code == 200
        assert len(response.json()) >= 1
        assert all(
            "SearchHonda" in vehicle["make"]
            for vehicle in response.json()
        )


def test_search_vehicle_by_price_range():
    """Search respects minimum and maximum prices."""
    with TestClient(app) as client:
        admin_headers = register_and_login(client, role="admin")

        create_response = client.post(
            "/api/vehicles",
            headers=admin_headers,
            json={
                "make": "PriceTest",
                "model": "BudgetCar",
                "category": "Hatchback",
                "price": 15000,
                "quantity": 2,
            },
        )

        assert create_response.status_code == 201

        user_headers = register_and_login(client)

        response = client.get(
            "/api/vehicles/search",
            headers=user_headers,
            params={
                "min_price": 10000,
                "max_price": 20000,
            },
        )

        assert response.status_code == 200

        for vehicle in response.json():
            assert 10000 <= vehicle["price"] <= 20000


def test_search_rejects_invalid_price_range():
    """Minimum price cannot exceed maximum price."""
    with TestClient(app) as client:
        headers = register_and_login(client)

        response = client.get(
            "/api/vehicles/search",
            headers=headers,
            params={
                "min_price": 30000,
                "max_price": 10000,
            },
        )

        assert response.status_code == 400


def test_update_vehicle():
    """Administrators can update vehicle details."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        create_response = client.post(
            "/api/vehicles",
            headers=headers,
            json={
                "make": "UpdateHonda",
                "model": "UpdateCity",
                "category": "Sedan",
                "price": 18000,
                "quantity": 3,
            },
        )

        assert create_response.status_code == 201
        vehicle_id = create_response.json()["id"]

        update_response = client.put(
            f"/api/vehicles/{vehicle_id}",
            headers=headers,
            json={
                "price": 19000,
                "quantity": 2,
            },
        )

        assert update_response.status_code == 200
        assert update_response.json()["id"] == vehicle_id
        assert update_response.json()["price"] == 19000
        assert update_response.json()["quantity"] == 2


def test_regular_user_cannot_update_vehicle():
    """Regular users cannot change inventory."""
    with TestClient(app) as client:
        admin_headers = register_and_login(client, role="admin")

        create_response = client.post(
            "/api/vehicles",
            headers=admin_headers,
            json={
                "make": "ProtectedHonda",
                "model": "ProtectedCity",
                "category": "Sedan",
                "price": 18000,
                "quantity": 3,
            },
        )

        vehicle_id = create_response.json()["id"]
        user_headers = register_and_login(client)

        response = client.put(
            f"/api/vehicles/{vehicle_id}",
            headers=user_headers,
            json={"price": 19000},
        )

        assert response.status_code == 403


def test_update_nonexistent_vehicle():
    """Updating a missing vehicle returns 404 for an admin."""
    with TestClient(app) as client:
        headers = register_and_login(client, role="admin")

        response = client.put(
            "/api/vehicles/99999999",
            headers=headers,
            json={"price": 19000},
        )

        assert response.status_code == 404
