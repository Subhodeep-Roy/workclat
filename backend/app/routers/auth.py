from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field

router = APIRouter(prefix="/auth", tags=["auth"])

security = HTTPBearer()

# In-memory user registry — keyed by email
users_db: dict[str, dict] = {
    "admin@vendorflow.ai": {
        "email": "admin@vendorflow.ai",
        "name": "Admin User",
        "password": "password123",
        "role": "administrator",
    }
}


class RegisterRequest(BaseModel):
    name: str = Field(...)
    email: str = Field(...)
    password: str = Field(...)


class LoginRequest(BaseModel):
    email: str = Field(...)
    password: str = Field(...)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    name: str


class UserProfile(BaseModel):
    email: str
    role: str
    name: str


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> UserProfile:
    token = credentials.credentials
    # In this demo, the token is simply the user's email
    user = users_db.get(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid token or user not found")
    return UserProfile(email=user["email"], role=user["role"], name=user["name"])


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(payload: RegisterRequest) -> AuthResponse:
    if payload.email in users_db:
        raise HTTPException(status_code=409, detail="Email already registered")
    users_db[payload.email] = {
        "email": payload.email,
        "name": payload.name,
        "password": payload.password,
        "role": "user",
    }
    # Access token is the email — simple demo approach
    return AuthResponse(
        access_token=payload.email,
        role="user",
        email=payload.email,
        name=payload.name,
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest) -> AuthResponse:
    user = users_db.get(payload.email)
    if not user or user["password"] != payload.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return AuthResponse(
        access_token=payload.email,
        role=user["role"],
        email=payload.email,
        name=user["name"],
    )


@router.get("/me", response_model=UserProfile)
def get_me(current_user: UserProfile = Depends(get_current_user)) -> UserProfile:
    return current_user

