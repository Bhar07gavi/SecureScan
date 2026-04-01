from beanie import Document
from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional


class VulnerabilityData(BaseModel):
    """Embedded vulnerability data"""
    id: str
    type: str
    severity: str
    line: int
    description: str
    location: str


class ScanHistory(Document):
    """Scan history document for MongoDB"""
    
    # Scan Information
    code: str = Field(..., description="Scanned code (truncated)")
    language: str = Field(default="python", description="Programming language")
    
    # Results
    vulnerabilities: List[VulnerabilityData] = Field(default_factory=list)
    risk_score: float = Field(..., ge=0.0, le=1.0)
    risk_level: str = Field(..., description="Critical, High, Medium, Low, Safe")
    
    # Metadata
    scan_date: datetime = Field(default_factory=datetime.utcnow)
    user_id: Optional[str] = None
    ip_address: Optional[str] = None
    
    # Statistics
    total_vulnerabilities: int = 0
    critical_count: int = 0
    high_count: int = 0
    medium_count: int = 0
    low_count: int = 0
    
    class Settings:
        name = "scan_history"
        indexes = [
            "scan_date",
            "risk_level",
            "language"
        ]
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "password = 'admin123'",
                "language": "python",
                "risk_score": 0.95,
                "risk_level": "Critical",
                "total_vulnerabilities": 1
            }
        }