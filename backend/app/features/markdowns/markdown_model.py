from datetime import UTC, datetime
from uuid import UUID, uuid4

from pydantic import BaseModel, Field


class MarkdownHeader(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class MarkdownCreate(BaseModel):
    title: str
    content: str

class MarkdownUpdate(MarkdownCreate):
    pass

class MarkdownPatch(BaseModel):
    title: str | None = None
    content: str | None = None


class Markdown(MarkdownHeader):
    content: str

    @classmethod
    def create(cls, value: MarkdownCreate) -> "Markdown":
        return cls(**value.model_dump())
