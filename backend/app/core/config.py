from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    API_TITLE: str = "SecureScan AI Backend"
    API_VERSION: str = "1.0.0"

    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ]

    MONGODB_URL: str = "mongodb://localhost:27017"
    MONGODB_DB_NAME: str = "securescan_db"
    MONGODB_ATLAS_URL: Optional[str] = None

    MODEL_PATH: str = "models/my_trained_model.pt"
    VECTORIZER_PATH: str = "models/vectorizer.pkl"
    METADATA_PATH: str = "models/model_metadata.pkl"

    DEVICE: str = "cpu"
    SECRET_KEY: str = "your-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    ENVIRONMENT: str = "development"
    
    # ✅ ADD THIS LINE:
    GOOGLE_CLIENT_ID: str = ""

    @property
    def mongodb_connection_string(self) -> str:
        if self.ENVIRONMENT == "production" and self.MONGODB_ATLAS_URL:
            return self.MONGODB_ATLAS_URL
        return self.MONGODB_URL

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()