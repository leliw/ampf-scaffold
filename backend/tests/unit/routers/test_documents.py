from pathlib import Path

from ampf.testing import ApiTestClient
from features.documents.document_model import Document, DocumentCreate, DocumentPatch

from tests.conftest import read_request_file


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/documents")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_put_delete(client: ApiTestClient):
    # Test POST (Upload a file)
    file_content = "This is a test markdown document."
    file_name = "test_document.md"
    content_type = "text/markdown"
    files = {"file": (file_name, file_content, content_type)}
    document_create = DocumentCreate(name=file_name, content_type=content_type)
    document = client.post_typed(
        "/api/documents",
        201,
        Document,
        files=files,
        data=document_create.model_dump(mode="json"),
    )
    assert document
    assert file_name == document.name

    # Test GET all documents
    all_documents = client.get_typed_list("/api/documents", 200, Document)
    assert len(all_documents) == 1
    assert all_documents[0].name == document.name
    assert all_documents[0].content_type == content_type

    # Test GET a specific document data
    ret = client.get_typed(f"/api/documents/{document.id}", 200, Document)
    assert ret.name == document.name
    assert ret.content_type == document.content_type

    # Test GET a specific document content
    ret = client.get(f"/api/documents/{document.id}/content", 200)
    assert ret.headers["content-type"].startswith(content_type)
    assert ret.headers["content-disposition"] == f'attachment; filename="{file_name}"'
    assert ret.content == file_content.encode()

    # Test PUT (Upload a new content)
    new_content = "This is a new markdown document."
    new_name = "new_document.md"
    files = {"file": (new_name, new_content, content_type)}
    client.put(
        f"/api/documents/{document.id}/content",
        204,
        files=files,
    )
    response = client.get(f"/api/documents/{document.id}/content", 200)
    assert response.headers["content-type"].startswith(content_type)
    assert response.content == new_content.encode()

    # Test PATCH
    document_patch = DocumentPatch(name="updated_document.md")
    ret = client.patch_typed(f"/api/documents/{document.id}", 200, Document, json=document_patch)
    assert ret.name == document_patch.name
    assert ret.content_type == document.content_type

    # Test DELETE the document
    client.delete(f"/api/documents/{document.id}", 204)
    client.get(f"/api/documents/{document.id}", 404)


def test_post_binary(client: ApiTestClient):
    # Given: A binary document
    file_path = Path("./tests/data/sample.pdf")
    files = read_request_file(file_path)
    # When: It is sent
    document = client.post_typed("/api/documents", 201, Document, files=files, data={"name": "Sample"})
    # Then: A document is returned
    assert document.id
