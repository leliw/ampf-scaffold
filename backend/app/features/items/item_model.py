from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ItemHeader(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ItemCreate(BaseModel):
    title: str
    content: str

class ItemUpdate(ItemCreate):
    title: str
    content: str

class ItemPatch(BaseModel):
    title: str | None = None
    content: str | None = None


class Item(ItemHeader):
    content: str

    @classmethod
    def create(cls, value: ItemCreate) -> "Item":
        return cls(**value.model_dump())
