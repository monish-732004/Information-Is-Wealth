import asyncpg
import os
from dotenv import load_dotenv

load_dotenv()

_pool = None


async def connect_db():
    global _pool
    _pool = await asyncpg.create_pool(
        dsn=os.getenv("DATABASE_URL"),
        min_size=2,
        max_size=10,
        ssl="require",
    )
    print("✅ Supabase database connected")


async def disconnect_db():
    global _pool
    if _pool:
        await _pool.close()
        print("Database disconnected")


def get_pool():
    if _pool is None:
        raise RuntimeError("Database pool not initialized. Did startup run?")
    return _pool