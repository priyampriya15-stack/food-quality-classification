"""Database Engine, Session Management, and Base Definition.

Configures SQLite SQLAlchemy engine with thread safety and provides session dependencies.
"""

from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from backend.app.core.config import settings, PROJECT_ROOT

# Resolve and normalize database URL
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)
elif db_url.startswith("sqlite:///./"):
    db_filename = db_url.replace("sqlite:///./", "")
    abs_db_path = (PROJECT_ROOT / db_filename).resolve()
    db_url = f"sqlite:///{abs_db_path}"

# SQLite-specific connect args (thread check is SQLite only)
connect_args = {"check_same_thread": False} if db_url.startswith("sqlite") else {}

engine = create_engine(
    db_url,
    connect_args=connect_args,
    echo=settings.DEBUG and False,  # Quiet query logging
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a database session and guarantees closure."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Create all defined database tables and apply backward-compatible schema migrations."""
    # Import models here so Base metadata registers them
    import backend.app.models.prediction  # noqa: F401
    import backend.app.models.user  # noqa: F401
    Base.metadata.create_all(bind=engine)

    # In SQLite, create_all does not add new columns to existing tables.
    # Check if 'user_id' exists on 'predictions' table; if not, add it.
    if db_url.startswith("sqlite"):
        try:
            from sqlalchemy import text
            with engine.connect() as conn:
                result = conn.execute(text("PRAGMA table_info(predictions)"))
                columns = [row[1] for row in result.fetchall()]
                if columns and "user_id" not in columns:
                    conn.execute(text("ALTER TABLE predictions ADD COLUMN user_id INTEGER REFERENCES users(id)"))
                    conn.commit()
                if columns and "notes" not in columns:
                    conn.execute(text("ALTER TABLE predictions ADD COLUMN notes VARCHAR(500)"))
                    conn.commit()
        except Exception:
            pass
