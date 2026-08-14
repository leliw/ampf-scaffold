from contextlib import contextmanager
from typing import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from shared.mariadb.mariadb_config import MariaDBConfig


class MariaDBEngine:
    def __init__(self, mariadb_database_url: str):
        self.engine = create_engine(
            mariadb_database_url,
            pool_size=5,
            max_overflow=10,
            pool_pre_ping=True,
            pool_recycle=3600,
        )

    @classmethod
    def from_url(cls, mariadb_database_url: str) -> "MariaDBEngine":
        return cls(mariadb_database_url)
    
    @classmethod
    def from_config(cls, config: MariaDBConfig) -> "MariaDBEngine":
        return cls(config.get_database_url())
    
    @contextmanager
    def session(self) -> Iterator[Session]:
        session = sessionmaker(bind=self.engine, autoflush=True)
        db = session()
        try:
            yield db
        finally:
            db.close()
