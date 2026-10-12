from datetime import UTC, datetime
from uuid import UUID, uuid4

from ampf.tasks import TaskMixin, TaskPatch, TaskStatus
from pydantic import BaseModel, Field


class ItemHeader(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    title: str
    processed_title: str | None = None
    status: TaskStatus | None = None
    error_message: str | None = None
    scheduled_at: datetime | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))


class ItemCreate(BaseModel):
    title: str
    content: str


class ItemUpdate(ItemCreate):
    title: str
    content: str


class ItemPatch(TaskPatch):
    title: str | None = None
    processed_title: str | None = None
    content: str | None = None


class Item(ItemHeader, TaskMixin):
    content: str

    @classmethod
    def create(cls, value: ItemCreate) -> "Item":
        ret = cls(**value.model_dump())
        ret.schedule()
        return ret

    def to_header(self) -> ItemHeader:
        return ItemHeader.model_validate(self.model_dump(), extra="ignore")
