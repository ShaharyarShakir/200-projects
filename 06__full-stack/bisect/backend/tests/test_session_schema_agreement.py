"""Assert the Alembic migrations and the SQLModel metadata agree.

Tests create their schema with ``SQLModel.metadata.create_all`` (see
``conftest.py``) while production applies the Alembic migrations. Those two
paths build the same schema by different means, so they can drift: a column or
constraint added to a model but never migrated passes every test and then fails
in production, or the reverse. The ``Repository`` model already carries a
comment noting its constraint must stay in sync with ``b7e2c4a91d38`` for
exactly this reason.

This test closes the gap by building the same schema both ways and comparing the
resulting ``agent_sessions`` and ``agent_session_events`` tables column by
column. It uses a real on-disk SQLite file rather than ``:memory:`` because
Alembic opens its own connection and an in-memory database is private to the
connection that created it.
"""

from pathlib import Path
from typing import Dict, List, Tuple

import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, inspect

from sqlmodel import SQLModel

import app.models  # noqa: F401  (imported for its metadata side effect)

ALEMBIC_INI = Path(__file__).resolve().parents[1] / "alembic.ini"
COMPARED_TABLES = ("agent_sessions", "agent_session_events")


def _describe(url: str) -> Dict[str, Dict[str, Tuple[str, ...]]]:
    """Return ``{table: {column: (type, nullable)}}`` for the tables of interest."""
    engine = create_engine(url)
    try:
        inspector = inspect(engine)
        described: Dict[str, Dict[str, Tuple[str, ...]]] = {}
        for table in COMPARED_TABLES:
            columns = inspector.get_columns(table)
            described[table] = {
                col["name"]: (str(col["type"]), col["nullable"]) for col in columns
            }
        return described
    finally:
        engine.dispose()


def _migrated_columns(sqlite_path: Path) -> Dict[str, Dict[str, Tuple[str, ...]]]:
    """Build the schema by running the Alembic migrations against a scratch file."""
    url = f"sqlite:///{sqlite_path}"
    config = Config(str(ALEMBIC_INI))
    # env.py reads the URL from application settings, so it is injected here
    # rather than through sqlalchemy.url in the ini file.
    config.set_main_option("script_location", str(ALEMBIC_INI.parent / "alembic"))
    config.set_main_option("sqlalchemy.url", url)

    from app.core import config as app_config

    original_url = app_config.settings.DATABASE_URL
    app_config.settings.DATABASE_URL = url
    try:
        command.upgrade(config, "head")
    finally:
        app_config.settings.DATABASE_URL = original_url

    return _describe(url)


@pytest.fixture(scope="module")
def metadata_columns(tmp_path_factory: pytest.TempPathFactory) -> Dict[str, Dict[str, Tuple[str, ...]]]:
    """Describe the tables as ``SQLModel.metadata.create_all`` builds them."""
    sqlite_path = tmp_path_factory.mktemp("metadata") / "metadata.db"
    url = f"sqlite:///{sqlite_path}"
    engine = create_engine(url)
    try:
        SQLModel.metadata.create_all(engine)
    finally:
        engine.dispose()
    return _describe(url)


@pytest.fixture(scope="module")
def migration_columns(tmp_path_factory: pytest.TempPathFactory) -> Dict[str, Dict[str, Tuple[str, ...]]]:
    """Describe the tables as the Alembic migrations build them."""
    sqlite_path = tmp_path_factory.mktemp("migrations") / "migrated.db"
    return _migrated_columns(sqlite_path)


@pytest.mark.parametrize("table", COMPARED_TABLES)
def test_migrations_create_the_compared_tables(
    migration_columns: Dict[str, Dict[str, Tuple[str, ...]]], table: str
) -> None:
    """A missing table is the loudest possible drift, so assert presence first."""
    assert table in migration_columns, f"{table} is absent from the Alembic migrations"


@pytest.mark.parametrize("table", COMPARED_TABLES)
def test_migration_and_metadata_agree_on_column_names(
    metadata_columns: Dict[str, Dict[str, Tuple[str, ...]]],
    migration_columns: Dict[str, Dict[str, Tuple[str, ...]]],
    table: str,
) -> None:
    """The same columns must exist in both schemas, with no extras on either side."""
    from_metadata: List[str] = sorted(metadata_columns[table])
    from_migrations: List[str] = sorted(migration_columns[table])

    only_in_metadata = sorted(set(from_metadata) - set(from_migrations))
    only_in_migrations = sorted(set(from_migrations) - set(from_metadata))

    assert not only_in_metadata, (
        f"{table}: columns present in SQLModel metadata but never migrated: {only_in_metadata}"
    )
    assert not only_in_migrations, (
        f"{table}: columns created by migrations but absent from SQLModel metadata: {only_in_migrations}"
    )


@pytest.mark.parametrize("table", COMPARED_TABLES)
def test_migration_and_metadata_agree_on_column_types_and_nullability(
    metadata_columns: Dict[str, Dict[str, Tuple[str, ...]]],
    migration_columns: Dict[str, Dict[str, Tuple[str, ...]]],
    table: str,
) -> None:
    """A column that exists in both but differs in type or nullability is drift too."""
    mismatches = []
    for column, (column_type, nullable) in metadata_columns[table].items():
        if column not in migration_columns[table]:
            # Missing columns are reported by the name-agreement test with a
            # clearer message; skip them here rather than raising a KeyError.
            continue
        migrated_type, migrated_nullable = migration_columns[table][column]
        if (column_type, nullable) != (migrated_type, migrated_nullable):
            mismatches.append(
                f"{column}: metadata=({column_type}, nullable={nullable}) "
                f"migrations=({migrated_type}, nullable={migrated_nullable})"
            )
    assert not mismatches, f"{table}: column definition drift: {mismatches}"
