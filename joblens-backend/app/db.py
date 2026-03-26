"""
app/db.py
Async MongoDB connection using Motor.
"""
from __future__ import annotations
import os
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection

logger = logging.getLogger(__name__)
_client: AsyncIOMotorClient | None = None


async def connect_db():
    global _client
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    _client = AsyncIOMotorClient(uri)
    logger.info(f"MongoDB connected: {uri}")


async def close_db():
    if _client:
        _client.close()
        logger.info("MongoDB connection closed.")


async def get_scans_collection() -> AsyncIOMotorCollection:
    db_name = os.getenv("MONGO_DB", "joblens")
    return _client[db_name]["scans"]
