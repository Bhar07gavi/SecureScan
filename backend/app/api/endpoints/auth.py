# backend/app/api/endpoints/auth.py - COMPLETE FIXED VERSION

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr, Field
from datetime import datetime, timedelta
from typing import Optional
import jwt
import bcrypt
from app.models.user import User
from app.core.config import settings
import logging
import os

logger = logging.getLogger(__name__)
router = APIRouter()
security = HTTPBearer()


# ============== SCHEMAS ==============
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime
    total_scans: int


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    username: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)


class GoogleLoginRequest(BaseModel):
    token: str


# ============== UTILS ==============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def create_token(user_id: str, email: str) -> tuple:
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    expire = datetime.utcnow() + expires_delta

    payload = {
        "sub": user_id,
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow()
    }

    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token, settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    token = credentials.credentials

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = await User.get(user_id)

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        if not user.is_active:
            raise HTTPException(status_code=401, detail="User is inactive")

        return user

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


def _build_token_response(user: User) -> TokenResponse:
    token, expires_in = create_token(str(user.id), user.email)
    return TokenResponse(
        access_token=token,
        expires_in=expires_in,
        user=UserResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            full_name=user.full_name,
            is_active=user.is_active,
            created_at=user.created_at,
            total_scans=user.total_scans
        )
    )


# ============== ENDPOINTS ==============
@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister):
    existing_email = await User.find_one(User.email == data.email)
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    existing_username = await User.find_one(User.username == data.username)
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    user = User(
        email=data.email,
        username=data.username,
        hashed_password=hash_password(data.password),
        full_name=data.full_name,
        created_at=datetime.utcnow()
    )
    await user.insert()
    logger.info(f"✅ New user registered: {data.email}")

    return _build_token_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await User.find_one(User.email == data.email)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is deactivated")

    user.last_login = datetime.utcnow()
    await user.save()

    logger.info(f"✅ User logged in: {data.email}")
    return _build_token_response(user)


@router.post("/google", response_model=TokenResponse)
async def google_login(data: GoogleLoginRequest):
    """Login or Register with Google"""
    try:
        # Decode Google JWT token (without verification for simplicity)
        # In production, verify with Google's public keys
        import base64
        import json

        # Split the JWT token
        parts = data.token.split('.')
        if len(parts) != 3:
            raise HTTPException(status_code=400, detail="Invalid Google token format")

        # Decode payload (part 2)
        payload = parts[1]
        # Add padding if needed
        payload += '=' * (4 - len(payload) % 4)
        decoded = base64.urlsafe_b64decode(payload)
        google_data = json.loads(decoded)

        email = google_data.get('email')
        name = google_data.get('name', '')
        picture = google_data.get('picture', '')

        if not email:
            raise HTTPException(status_code=400, detail="Email not found in Google token")

        # Check if user exists
        user = await User.find_one(User.email == email)

        if not user:
            # Create new user
            username = email.split('@')[0].lower().replace('.', '_').replace('+', '_')

            # Ensure unique username
            existing = await User.find_one(User.username == username)
            if existing:
                import random
                username = f"{username}_{random.randint(1000, 9999)}"

            user = User(
                email=email,
                username=username,
                hashed_password=hash_password(f"google_{email}_{datetime.utcnow().timestamp()}"),
                full_name=name,
                created_at=datetime.utcnow()
            )
            await user.insert()
            logger.info(f"✅ New Google user: {email}")

        # Update last login
        user.last_login = datetime.utcnow()
        if name and not user.full_name:
            user.full_name = name
        await user.save()

        return _build_token_response(user)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google login error: {e}")
        raise HTTPException(status_code=500, detail=f"Google login failed: {str(e)}")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        total_scans=current_user.total_scans
    )


@router.put("/me", response_model=UserResponse)
async def update_profile(data: UserUpdate, current_user: User = Depends(get_current_user)):
    if data.username:
        existing = await User.find_one(User.username == data.username)
        if existing and str(existing.id) != str(current_user.id):
            raise HTTPException(status_code=400, detail="Username already taken")
        current_user.username = data.username

    if data.full_name is not None:
        current_user.full_name = data.full_name

    await current_user.save()

    return UserResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        full_name=current_user.full_name,
        is_active=current_user.is_active,
        created_at=current_user.created_at,
        total_scans=current_user.total_scans
    )


@router.post("/change-password")
async def change_password(data: PasswordChange, current_user: User = Depends(get_current_user)):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    current_user.hashed_password = hash_password(data.new_password)
    await current_user.save()

    return {"message": "Password changed successfully"}


@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    return {"message": "Logged out successfully"}


@router.delete("/me")
async def delete_account(current_user: User = Depends(get_current_user)):
    await current_user.delete()
    return {"message": "Account deleted successfully"}