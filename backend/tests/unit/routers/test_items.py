from ampf.testing import ApiTestClient
from features.items.item_model import Item, ItemCreate


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/items")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_put_delete(client: ApiTestClient):
    # POST
    value_create = ItemCreate(title="X", content="xxx")
    value = client.post_typed("/api/items", 200, Item, json=value_create)

    # GET
    r = client.get_typed(f"/api/items/{value.id}", 200, Item)
    assert r.title == value_create.title
    assert r.content == value_create.content

    # PUT
    value.title = "Y"
    r = client.put(f"/api/items/{value.id}", 200, json=value)
    r = client.get_typed(f"/api/items/{value.id}", 200, Item)
    assert r.title == value.title

    # DELETE
    client.delete(f"/api/items/{value.id}", 200)
    client.get(f"/api/items/{value.id}", 404)
