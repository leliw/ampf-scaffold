import asyncio
from pathlib import Path

import pytest
from ampf.base import BaseBlobMetadata, BaseFactory
from ampf.tasks import TaskStatus
from ampf.testing import ApiTestClient
from features.documents.document_model import Document

from tests.conftest import read_request_file


@pytest.fixture(autouse=True)
def clean_database(factory: BaseFactory):
    yield
    factory.get_collection("documents").drop()
    factory.get_collection("markdowns").drop()
    factory.create_blob_storage("documents", BaseBlobMetadata).drop()


@pytest.mark.timeout(120)
@pytest.mark.asyncio
async def test_convert_document(client: ApiTestClient):
    # Given: An uploaded binary document
    file_path = Path(__file__).resolve().parent.parent / "data" / "sample.pdf"
    files = read_request_file(file_path)
    document = client.post_typed("/api/documents", 201, Document, files=files, data={"name": "Sample"})
    assert document.id
    assert document.status in [TaskStatus.PENDING, TaskStatus.RUNNING]
    # When: It is converted
    client.post(f"/api/documents/{document.id}/convert-to-md", 202)
    while document.status in [TaskStatus.PENDING, TaskStatus.RUNNING]:
        await asyncio.sleep(0.5)
        document = client.get_typed(f"/api/documents/{document.id}", 200, Document)
    # Then:
    assert document.status == TaskStatus.COMPLETED
