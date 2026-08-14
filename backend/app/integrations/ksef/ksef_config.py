from pydantic import BaseModel


class KsefConfig(BaseModel):
    base_url: str
    token: str
    nip: str
