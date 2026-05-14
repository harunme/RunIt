from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from app.database import get_db
from app.models.user import User
from app.auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


@router.post("/register", response_model=AuthResponse)
async def register(request: RegisterRequest, db=Depends(get_db)):
    # Check if user exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=request.email,
        password_hash=get_password_hash(request.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create token
    token = create_access_token({"sub": user.id, "email": user.email})

    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email}
    )


@router.post("/login", response_model=AuthResponse)
async def login(request: LoginRequest, db=Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": user.id, "email": user.email})

    return AuthResponse(
        access_token=token,
        user={"id": user.id, "email": user.email}
    )


@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


@router.post("/logout")
async def logout():
    return {"status": "ok"}
