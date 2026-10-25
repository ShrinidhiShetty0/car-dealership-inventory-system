
import os
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone

import jwt
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from pwdlib import PasswordHash
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import Base, engine, get_db
from models import User, Vehicle


# -------------------- CONFIGURATION --------------------

SECRET_KEY = os.environ.get(
    "JWT_SECRET_KEY",
    "dev-only-change-this-secret-before-submission",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 30

password_hash = PasswordHash.recommended()
bearer_scheme = HTTPBearer(auto_error=False)


# -------------------- REQUEST MODELS --------------------

class UserRegister(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserLogin(BaseModel):
    username: str
    password: str


class VehicleCreate(BaseModel):
    make: str = Field(min_length=1, max_length=100)
    model: str = Field(min_length=1, max_length=100)
    category: str = Field(min_length=1, max_length=100)
    price: float = Field(gt=0, allow_inf_nan=False)
    quantity: int = Field(ge=0)


class VehicleUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    make: str | None = Field(default=None, min_length=1, max_length=100)
    model: str | None = Field(default=None, min_length=1, max_length=100)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    price: float | None = Field(
        default=None, gt=0, allow_inf_nan=False
    )
    quantity: int | None = Field(default=None, ge=0)


# -------------------- DATABASE INITIALIZATION --------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Car Dealership Inventory System",
    description="Vehicle inventory, authentication and purchasing API",
    version="1.0.0",
    lifespan=lifespan,
)


# -------------------- CORS CONFIGURATION --------------------
# Allows the Live Server frontend to communicate with FastAPI.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------- HELPERS --------------------

def vehicle_to_dict(vehicle: Vehicle):
    return {
        "id": vehicle.id,
        "make": vehicle.make,
        "model": vehicle.model,
        "category": vehicle.category,
        "price": vehicle.price,
        "quantity": vehicle.quantity,
    }


def create_access_token(user_id: int, role: str) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": str(user_id),
        "role": role,
        "iat": now,
        "exp": now + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        bearer_scheme
    ),
    db: Session = Depends(get_db),
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = jwt.decode(
            credentials.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )
        user_id = int(payload["sub"])

    except (jwt.InvalidTokenError, KeyError, TypeError, ValueError):
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User no longer exists",
        )

    return user


def require_admin(current_user=Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Administrator privileges required",
        )

    return current_user


def get_vehicle_or_404(vehicle_id: int, db: Session):
    vehicle = (
        db.query(Vehicle)
        .filter(Vehicle.id == vehicle_id)
        .first()
    )

    if vehicle is None:
        raise HTTPException(
            status_code=404,
            detail="Vehicle not found",
        )

    return vehicle


# -------------------- HOMEPAGE --------------------

@app.get("/")
def homepage():
    return {"message": "Car Dealership API"}


# -------------------- REGISTRATION --------------------

@app.post("/api/auth/register", status_code=201)
def register_user(
    user_data: UserRegister,
    db: Session = Depends(get_db),
):
    username = user_data.username.strip()
    email = str(user_data.email).strip().lower()

    if len(username) < 3:
        raise HTTPException(
            status_code=422,
            detail="Username must contain at least 3 characters",
        )

    user = User(
        username=username,
        email=email,
        hashed_password=password_hash.hash(user_data.password),
        role="user",
    )

    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="Username or email already registered",
        )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "role": user.role,
    }


# -------------------- LOGIN --------------------

@app.post("/api/auth/login")
def login_user(
    credentials: UserLogin,
    db: Session = Depends(get_db),
):
    user = (
        db.query(User)
        .filter(User.username == credentials.username.strip())
        .first()
    )

    if user is None or not password_hash.verify(
        credentials.password,
        user.hashed_password,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    return {
        "access_token": create_access_token(user.id, user.role),
        "token_type": "bearer",
        "username": user.username,
        "role": user.role,
    }


# -------------------- LIST VEHICLES --------------------

@app.get("/api/vehicles")
def list_vehicles(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicles = db.query(Vehicle).all()
    return [vehicle_to_dict(vehicle) for vehicle in vehicles]


# -------------------- ADD VEHICLE: ADMIN ONLY --------------------

@app.post("/api/vehicles", status_code=201)
def add_vehicle(
    vehicle_data: VehicleCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    values = vehicle_data.model_dump()

    for field in ("make", "model", "category"):
        values[field] = values[field].strip()

        if not values[field]:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be empty",
            )

    vehicle = Vehicle(**values)
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    return vehicle_to_dict(vehicle)


# -------------------- SEARCH VEHICLES --------------------

@app.get("/api/vehicles/search")
def search_vehicles(
    make: str | None = None,
    model: str | None = None,
    category: str | None = None,
    min_price: float | None = Query(default=None, ge=0),
    max_price: float | None = Query(default=None, ge=0),
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be greater than max_price",
        )

    query = db.query(Vehicle)

    if make and make.strip():
        query = query.filter(
            Vehicle.make.ilike(f"%{make.strip()}%")
        )

    if model and model.strip():
        query = query.filter(
            Vehicle.model.ilike(f"%{model.strip()}%")
        )

    if category and category.strip():
        query = query.filter(
            Vehicle.category.ilike(f"%{category.strip()}%")
        )

    if min_price is not None:
        query = query.filter(Vehicle.price >= min_price)

    if max_price is not None:
        query = query.filter(Vehicle.price <= max_price)

    return [vehicle_to_dict(v) for v in query.all()]


# -------------------- UPDATE VEHICLE: ADMIN ONLY --------------------

@app.put("/api/vehicles/{vehicle_id}")
def update_vehicle(
    vehicle_id: int,
    vehicle_data: VehicleUpdate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vehicle = get_vehicle_or_404(vehicle_id, db)
    updates = vehicle_data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update",
        )

    for field, value in updates.items():
        if value is None:
            raise HTTPException(
                status_code=422,
                detail=f"{field} cannot be null",
            )

        if isinstance(value, str):
            value = value.strip()

            if not value:
                raise HTTPException(
                    status_code=422,
                    detail=f"{field} cannot be empty",
                )

        setattr(vehicle, field, value)

    db.commit()
    db.refresh(vehicle)

    return vehicle_to_dict(vehicle)


# -------------------- PURCHASE VEHICLE --------------------

@app.post("/api/vehicles/{vehicle_id}/purchase")
def purchase_vehicle(
    vehicle_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = get_vehicle_or_404(vehicle_id, db)

    if vehicle.quantity <= 0:
        raise HTTPException(
            status_code=409,
            detail="Vehicle is out of stock",
        )

    vehicle.quantity -= 1
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle purchased successfully",
        "vehicle": vehicle_to_dict(vehicle),
    }


# -------------------- RESTOCK VEHICLE: ADMIN ONLY --------------------

@app.post("/api/vehicles/{vehicle_id}/restock")
def restock_vehicle(
    vehicle_id: int,
    quantity: int = Query(gt=0),
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vehicle = get_vehicle_or_404(vehicle_id, db)

    vehicle.quantity += quantity
    db.commit()
    db.refresh(vehicle)

    return {
        "message": "Vehicle restocked successfully",
        "vehicle": vehicle_to_dict(vehicle),
    }


# -------------------- DELETE VEHICLE: ADMIN ONLY --------------------

@app.delete("/api/vehicles/{vehicle_id}", status_code=204)
def delete_vehicle(
    vehicle_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):
    vehicle = get_vehicle_or_404(vehicle_id, db)

    db.delete(vehicle)
    db.commit()

    return None
