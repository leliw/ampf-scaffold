from typing import Literal
from uuid import UUID

from ampf.base import BlobLocation
from pydantic import BaseModel


class ConversionRequest(BaseModel):
    job_id: UUID | None = None
    task_id: UUID | None = None
    input_file: BlobLocation
    output_file: BlobLocation
    metadata: dict[str, str] | None = None


class ConversionResponse(BaseModel):
    job_id: UUID | None = None
    task_id: UUID | None = None
    status: Literal["Success", "Error"]
    output_file: BlobLocation | None = None
    error_message: str | None = None
    original_request_metadata: dict[str, str] | None = None
