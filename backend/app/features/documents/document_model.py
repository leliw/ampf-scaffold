from datetime import UTC, datetime
from typing import Self
from uuid import UUID, uuid4

from ampf.base import BaseBlobMetadata
from pydantic import BaseModel, Field


class DocumentCreate(BaseModel):
    name: str
    content_type: str | None = None
    src_url: str | None = None
    keywords: list[str] | None = None


class DocumentPatch(BaseModel):
    name: str | None = None
    src_url: str | None = None
    keywords: list[str] | None = None


class Document(BaseModel):
    id: UUID = Field(default_factory=uuid4)
    name: str
    content_type: str
    keywords: list[str] | None = None
    src_url: str | None = None
    blob_name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))

    @classmethod
    def create(cls, document_create: DocumentCreate, blob_name: str) -> Self:
        return cls(
            name=document_create.name,
            content_type=document_create.content_type or "application/octet-stream",
            src_url=document_create.src_url,
            keywords=document_create.keywords,
            blob_name=blob_name,
        )


class DocumentMetadata(BaseBlobMetadata):
    @classmethod
    def create(cls, document: DocumentCreate | Document) -> Self:
        return cls(filename=document.name)

    def update(self, document: DocumentCreate | Document) -> None:
        self.filename = document.name
