from collections.abc import AsyncGenerator
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings


# base class for all sqlalchemy orm models to inherit from
class Base(DeclarativeBase):
    pass


# async engine that manages connection pooling to postgresql via asyncpg
engine = create_async_engine(settings.DATABASE_URL)

# factory function to create new isolated db sessions without auto-expiring objects on commit
async_session = async_sessionmaker(engine, expire_on_commit=False)


# fastapi dependency generator that yields an AsyncSession and closes it after the request
async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        yield session