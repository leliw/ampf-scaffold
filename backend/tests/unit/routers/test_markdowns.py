from ampf.testing import ApiTestClient
from features.markdowns.markdown_model import Markdown, MarkdownCreate


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/markdowns")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_put_delete(client: ApiTestClient):
    # POST
    value_create = MarkdownCreate(title="X", content="xxx")
    value = client.post_typed("/api/markdowns", 200, Markdown, json=value_create)

    # GET
    r = client.get_typed(f"/api/markdowns/{value.id}", 200, Markdown)
    assert r.title == value_create.title
    assert r.content == value_create.content

    # PUT
    value.title = "Y"
    r = client.put(f"/api/markdowns/{value.id}", 200, json=value)
    r = client.get_typed(f"/api/markdowns/{value.id}", 200, Markdown)
    assert r.title == value.title

    # DELETE
    client.delete(f"/api/markdowns/{value.id}", 200)
    client.get(f"/api/markdowns/{value.id}", 404)
