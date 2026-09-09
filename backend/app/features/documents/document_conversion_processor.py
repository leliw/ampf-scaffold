import logging
from uuid import UUID

from ampf.base import BaseAsyncFactory, BlobLocation
from ampf.dependency import DependencyRegistry
from ampf.tasks import TaskStatus
from features.documents.document_model import Document
from features.documents.document_service import DocumentService
from features.markdowns.markdown_model import MarkdownCreate
from features.markdowns.markdown_service import MarkdownService
from integrations.conversion_model import ConversionRequest, ConversionResponse

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class DocumentConversionProcessor:
    def __init__(
        self,
        document_service: DocumentService,
        markdown_service: MarkdownService,
        factory: BaseAsyncFactory,
    ):
        self.document_service = document_service
        self.markdown_service = markdown_service
        self.factory = factory

    async def get_conversion_request(self, document_id: UUID) -> tuple[ConversionRequest, Document]:
        document = await self.document_service.get(document_id)
        document = await self.document_service.update_task_status(document_id, TaskStatus.RUNNING)
        input_file = self.document_service.blob_storage.create_blob_location(document.blob_name)
        output_file = BlobLocation(name=f"{input_file.name}.md", bucket=input_file.bucket)
        return (ConversionRequest(
            input_file=input_file, output_file=output_file, metadata={"document_id": str(document_id)}
        ), document)

    async def process_conversion_response(self, response: ConversionResponse) -> None:
        _log.debug(response.model_dump_json(indent=2))
        if not response.original_request_metadata:
            raise ValueError("original_request_metadata is required in the response")

        raw_id = response.original_request_metadata.get("document_id")
        if not raw_id:
            raise ValueError("document_id is required in the original_request_metadata")
        document_id = UUID(raw_id)

        if response.status == "Success":
            if not response.output_file:
                raise ValueError("output_file is required in the response when status is Success")

            document = await self.document_service.get(document_id)
            markdown_blob = await self.factory.download_blob(response.output_file)
            markdown_create = MarkdownCreate(title=document.name, content=markdown_blob.content.decode(errors="replace"))
            await self.markdown_service.post(markdown_create)
            await self.factory.delete_blob(response.output_file)

        status = TaskStatus.COMPLETED if response.status == "Success" else TaskStatus.FAILED
        await self.document_service.update_task_status(document_id, status, response.error_message)
