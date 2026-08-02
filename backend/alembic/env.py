from alembic import context
from logging.config import fileConfig
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# import Base and metadata to enable autogenerate feature
from app.db import Base
from app.config import settings
import app.models  # registers models with Base metadata
import pgvector.sqlalchemy  # registers pgvector types for autogenerate detection

# alembic config object to access values from alembic.ini
config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# target metadata tells alembic what database schema to mirror
target_metadata = Base.metadata


# runs migrations in offline mode generating plain sql scripts
def run_migrations_offline() -> None:
    context.configure(
        url=settings.DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# helper function executing migrations within an active database connection
def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True
    )

    with context.begin_transaction():
        context.run_migrations()


# async engine runner for online migrations
async def run_async_migrations() -> None:
    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = settings.DATABASE_URL
    connectable = async_engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


# entrypoint determining whether to run online or offline migrations
def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()