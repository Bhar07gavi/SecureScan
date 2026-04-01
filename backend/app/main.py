from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.endpoints import scanner, ai_engine, project
from app.core.database import db
from app.core.config import settings
import logging

 # backend/app/main.py - ADD THIS LINE

from app.api.endpoints import scanner, ai_engine, project, auth  # Add auth 

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("=" * 70)
    logger.info("🚀 STARTING SECURESCAN AI BACKEND")
    logger.info("=" * 70)
    await db.connect_db()
    logger.info("✅ APPLICATION READY")
    logger.info("=" * 70)
    yield
    logger.info("🛑 SHUTTING DOWN")
    await db.close_db()


app = FastAPI(
    title=settings.API_TITLE,
    description="AI-Powered Code Vulnerability Detection",
    version=settings.API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# All 3 routers
app.include_router(scanner.router, prefix="/api/scan", tags=["Scanner"])
app.include_router(ai_engine.router, prefix="/api/ai", tags=["AI Engine"])
app.include_router(project.router, prefix="/api/project", tags=["Project Scanner"])

# Add auth router
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
@app.get("/", tags=["Root"])
async def root():
    return {
        "message": "SecureScan AI Backend is running",
        "status": "online",
        "version": settings.API_VERSION,
        "docs": "/docs"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    from app.services.model_service import model_service
    db_status = "connected" if db.client else "disconnected"
    return {
        "status": "healthy",
        "api_version": settings.API_VERSION,
        "model_loaded": model_service.is_loaded,
        "model_accuracy": model_service.metadata.get('accuracy', 0) if model_service.metadata else 0,
        "database": db_status,
        "environment": settings.ENVIRONMENT
    }


@app.get("/stats", tags=["Statistics"])
async def get_statistics():
    from app.models.scan import ScanHistory
    try:
        total_scans = await ScanHistory.count()
        critical = await ScanHistory.find(ScanHistory.risk_level == "Critical").count()
        high = await ScanHistory.find(ScanHistory.risk_level == "High").count()
        medium = await ScanHistory.find(ScanHistory.risk_level == "Medium").count()
        low = await ScanHistory.find(ScanHistory.risk_level == "Low").count()
        safe = await ScanHistory.find(ScanHistory.risk_level == "Safe").count()

        total_vulns = await ScanHistory.aggregate([
            {"$group": {"_id": None, "total": {"$sum": "$total_vulnerabilities"}}}
        ]).to_list()
        total_vulnerabilities_found = total_vulns[0]["total"] if total_vulns else 0

        return {
            "total_scans": total_scans,
            "total_vulnerabilities_found": total_vulnerabilities_found,
            "risk_distribution": {
                "critical": critical,
                "high": high,
                "medium": medium,
                "low": low,
                "safe": safe
            }
        }
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return {
            "total_scans": 0,
            "total_vulnerabilities_found": 0,
            "risk_distribution": {"critical": 0, "high": 0, "medium": 0, "low": 0, "safe": 0}
        }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)