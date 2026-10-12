from time import sleep
from uuid import uuid4

import pytest
from ampf.tasks import TaskStatus
from ampf.testing import ApiTestClient
from features.items.item_model import Item, ItemCreate, ItemHeader


def test_get_all_empty(client: ApiTestClient):
    response = client.get("/api/items")
    r = response.json()

    assert 200 == response.status_code
    assert 0 == len(r)


def test_post_get_put_delete(client: ApiTestClient):
    # POST
    value_create = ItemCreate(title="X", content="xxx")
    value = client.post_typed("/api/items", 202, Item, json=value_create)

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

def test_post_get_by_ids(client: ApiTestClient):
    # Given: Stored item
    value_create = ItemCreate(title="X", content="xxx")
    value = client.post_typed("/api/items", 202, Item, json=value_create)
    # When: Get item list with id
    headers = client.get_typed_list("/api/items", 200, ItemHeader, params={"ids": value.id})
    # Then: The item is returned
    assert len(headers) == 1
    assert headers[0].title == value.title
    # When: Get item list with any id
    headers = client.get_typed_list("/api/items", 200, ItemHeader, params={"ids": uuid4()})
    # Then: The list is empty
    assert len(headers) == 0

@pytest.mark.timeout(10)
def test_async_process(client: ApiTestClient):
    # When: An item is posted
    value_create = ItemCreate(title="title", content="xxx")
    value = client.post_typed("/api/items", 202, Item, json=value_create)
    # Then: The task is scheduled (or running because of DirectRunner in tests)
    assert value.status in [TaskStatus.PENDING, TaskStatus.RUNNING]
    assert value.scheduled_at is not None
    # And: A status is pending or running until completed
    while value.status and not value.status.is_finished():
        sleep(0.1)
        value = client.get_typed(f"/api/items/{value.id}", 200, Item)
    # And: Then it is completed
    assert value.status == TaskStatus.COMPLETED
    assert value.started_at
    assert value.finished_at
    assert value.processed_title
    assert value.processed_title == "TITLE"
