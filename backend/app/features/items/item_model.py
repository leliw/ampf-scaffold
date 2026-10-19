from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class ItemHeader(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str = Field(title="Title")
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), title="Created at")
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), title="Updated at")


class ItemCreate(BaseModel):
    title: str
    content: str


class ItemUpdate(ItemCreate):
    title: str | None = None
    content: str | None = None


class Item(ItemHeader):
    content: str
