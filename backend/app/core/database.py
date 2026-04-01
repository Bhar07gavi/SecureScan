from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.core.config import settings
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class MongoDB:
    client: Optional[AsyncIOMotorClient] = None

    @classmethod
    async def connect_db(cls):
        try:
            logger.info("🔌 Connecting to MongoDB...")
            connection_string = settings.mongodb_connection_string
            cls.client = AsyncIOMotorClient(connection_string)
            await cls.client.admin.command('ping')
            logger.info("✅ MongoDB connection successful!")

            database = cls.client.get_database(settings.MONGODB_DB_NAME)

            from app.models.scan import ScanHistory
            from app.models.user import User

            await init_beanie(
                database=database,
                document_models=[ScanHistory, User]
            )
            logger.info("✅ Beanie ODM initialized!")

        except Exception as e:
            logger.error(f"❌ MongoDB failed: {e}")
            cls.client = None

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            logger.info("🔌 MongoDB closed")

db = MongoDB()