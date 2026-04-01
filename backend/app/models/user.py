from beanie import Document
from pydantic import Field, EmailStr
from datetime import datetime
from typing import Optional


class User(Document):
    """User document for MongoDB"""
    
    # User Information
    email: EmailStr = Field(..., unique=True)
    username: str = Field(..., unique=True)
    hashed_password: str
    
    # Profile
    full_name: Optional[str] = None
    is_active: bool = Field(default=True)
    is_superuser: bool = Field(default=False)
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    
    # Usage Statistics
    total_scans: int = Field(default=0)
    total_vulnerabilities_found: int = Field(default=0)
    
    class Settings:
        name = "users"
        indexes = [
            "email",
            "username",
            "created_at"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "john_doe",
                "full_name": "John Doe"
            }
        }