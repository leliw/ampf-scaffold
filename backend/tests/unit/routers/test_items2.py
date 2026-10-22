from ampf.dynamic_cruds import TableDefinition
from ampf.testing import ApiTestClient
from features.items.item_model import Item, ItemCreate, ItemUpdate


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/items2")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_patch_delete(client: ApiTestClient):
    # POST
    value_create = ItemCreate(title="X", content="xxx")
    value = client.post_typed("/api/items2", 200, Item, json=value_create)

    # GET
    r = client.get_typed(f"/api/items2/{value.id}", 200, Item)
    assert r.title == value_create.title
    assert r.content == value_create.content

    # PATCH
    value_update = ItemUpdate(title="Y")
    r = client.patch(f"/api/items2/{value.id}", 200, json=value_update)
    r = client.get_typed(f"/api/items2/{value.id}", 200, Item)
    assert r.title == value_update.title

    # DELETE
    client.delete(f"/api/items2/{value.id}", 200)
    client.get(f"/api/items2/{value.id}", 404)

def test_get_table_structure(client: ApiTestClient):
    # Given: An application
    # When: Get table definition
    d = client.get_typed("/api/items2/definition/table", 200, TableDefinition)
    # Then: A definition is returned
    assert d.title == "Items2"
    assert d.actions == []
    assert len(d.columns) == 4
