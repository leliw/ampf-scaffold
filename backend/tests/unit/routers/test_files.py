from ampf.base import BlobHeader
from ampf.testing import ApiTestClient
from features.files.file_model import FileMetadata


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/files")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_put_delete(client: ApiTestClient):
    # Test POST (Upload a file)
    file_content = "This is a test markdown document."
    file_name = "test_document.md"
    content_type = "text/markdown"
    files = {"file": (file_name, file_content, content_type)}
    blob_header = client.post_typed("/api/files", 201, BlobHeader[FileMetadata], files=files)
    assert blob_header
    assert file_name == blob_header.metadata.filename

    # Test GET all documents
    all_documents = client.get_typed_list("/api/files", 200, BlobHeader[FileMetadata])
    assert len(all_documents) == 1
    assert all_documents[0].name == blob_header.name
    assert all_documents[0].metadata.content_type == content_type

    # Test GET a specific document content
    response = client.get(f"/api/files/{blob_header.name}", 200)
    assert response.headers["content-type"].startswith(content_type)
    assert response.headers["content-disposition"] == f'attachment; filename="{file_name}"'
    assert response.content == file_content.encode()

    # Test PUT (Upload a new content)
    new_content = "This is a new markdown document."
    new_name = "new_document.md"
    files = {"file": (new_name, new_content, content_type)}
    client.put(f"/api/files/{blob_header.name}", 204, files=files)
    response = client.get(f"/api/files/{blob_header.name}", 200)
    assert response.headers["content-type"].startswith(content_type)
    assert response.content == new_content.encode()

    # Test DELETE the document
    client.delete(f"/api/files/{blob_header.name}", 204)
    client.get(f"/api/files/{blob_header.name}", 404)
