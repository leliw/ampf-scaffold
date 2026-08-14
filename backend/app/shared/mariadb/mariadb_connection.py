from shared.mariadb.mariadb_config import MariaDBConfig

import mariadb


class MariaDBConnectionProvider:
    def __init__(self, config: MariaDBConfig):
        self.config = config

    def connect(self) -> "MariaDBConnection":
        return MariaDBConnection(self._connect())

    def _connect(self) -> mariadb.Connection:
        try:
            return mariadb.connect(**self.config.model_dump(exclude_none=True))
        except mariadb.Error as e:
            raise RuntimeError(f"Błąd połączenia z bazą danych: {e}") from e


class MariaDBConnection:
    def __init__(self, conn: mariadb.Connection):
        self.conn = conn
        self._entered = False
        self._closed = False

    def _ensure_open(self):
        if not self._entered:
            raise RuntimeError("Connection must be used inside 'with' block")
        if self._closed or not self.conn:
            raise RuntimeError("Connection is closed")

    def __enter__(self):
        self._entered = True
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        try:
            if not self._closed:
                if exc_type:
                    self.conn.rollback()
                else:
                    self.conn.commit()
        finally:
            if not self._closed:
                self.conn.close()
                self._closed = True

    def fetchone(self, query: str, params: tuple | None = None) -> dict | None:
        self._ensure_open()
        try:
            with self.conn.cursor(dictionary=True) as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchone()
        except mariadb.Error as e:
            raise RuntimeError(f"Błąd podczas wykonywania zapytania: {e}") from e

    def fetchall(self, query: str, params: tuple | None = None) -> list[dict]:
        self._ensure_open()
        try:
            with self.conn.cursor(dictionary=True) as cursor:
                cursor.execute(query, params or ())
                return cursor.fetchall()
        except mariadb.Error as e:
            raise RuntimeError(f"Błąd podczas wykonywania zapytania: {e}") from e
