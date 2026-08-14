from pydantic import BaseModel


class MariaDBConfig(BaseModel):
    host: str
    port: int = 3306
    user: str
    password: str
    database: str | None = None

    def get_database_url(self) -> str:
        database_part = f"/{self.database}" if self.database else ""
        return f"mysql+pymysql://{self.user}:{self.password}@{self.host}:{self.port}{database_part}"