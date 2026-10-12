# Async task

## Infra

Add topic, subsciption and proper roles.

#### infra/services/app/main.tf

```diff
   service_account_name         = "${var.name_prefix}-${local.service_name}-sa"
   service_account_display_name = "Service Account for Cloud Run - ${var.name_prefix}-${local.service_name}"
   service_account_roles = [
+    "roles/run.invoker",                  # Calls other scripts and Pub/Sub Push endpoints
     "roles/datastore.user",               # Uses Firestore
     "roles/secretmanager.secretAccessor", # Reads secrets 
+    # Pub/Sub
+    "roles/pubsub.publisher",
+    "roles/pubsub.subscriber",
+    "roles/pubsub.viewer",
     # OpenTelemetry
     "roles/logging.logWriter",       # Logi
     "roles/monitoring.metricWriter", # Metryki
     "roles/cloudtrace.agent",        # Trace'y
   ]
-  pubsub_topics        = {}
-  pubsub_subscriptions = {}
+  pubsub_topics = {
+    TASK_NAME = {
+      topic_name    = "${var.name_prefix}-process-item-request"
+      push_endpoint = "/pub-sub/task-processors/process-item"
+    }
+  }
+  pubsub_subscriptions = {
+    TASK_NAME = "${local.pubsub_topics["TASK_NAME"].topic_name}-sub"
+  }
   env_vars_plain = merge(var.env_vars_plain,
     {
       DEFAULT_USER__EMAIL         = "marcin.leliwa@gmail.com"
```

```diff
       GOOGLE_CLOUD_PROJECT = var.project_id
       PROJECT_ID           = var.project_id
       GCP_DATABASE         = google_firestore_database.database.name
+
+      TASK_NAME_TOPIC        = local.pubsub_topics["TASK_NAME"].topic_name
+      TASK_NAME_SUBSCRIPTION = local.pubsub_subscriptions["TASK_NAME"]
+      TASK_RUNNER            = var.create_app ? "PubsubPush" : "PubsubPull"
+
     },
     !var.create_app ? {
       for key, sub in local.pubsub_subscriptions :
```

## Backend

### Application

#### backend/app/core/app_config.py

```diff
    auth: AuthConfig = AuthConfig(jwt_secret_key="")
    default_user: DefaultUser = DefaultUser(username="admin", password="")
    smtp: SmtpConfig = SmtpConfig()
    reset_password_mail: ResetPasswordMailConfig = ResetPasswordMailConfig()
+
+    task_runner: Literal["Direct", "Background", "PubsubPull", "PubsubPush"]
+
+    task_name_topic: str | None = None
+    task_name_subscription: str | None = None
```

#### backend/app/app_state.py

```diff
-@dataclass
-class AppState:
-    config: AppConfig
-    factory: BaseAsyncFactory
+@dataclass(kw_only=True)
+class AppState(TasksAppState[AppConfig]):
```

#### backend/app/dependencies.py

```diff
def lifespan(config: AppConfig):
    DependencyRegistry.clear_objects()
    app_state = AppState.create(config)
    DependencyRegistry.add_all(app_state)
+    DependencyRegistry.add(app_state, TasksAppState)
```

#### /backend/app/features/items/item_model.py

```diff
 from datetime import UTC, datetime
 from uuid import UUID, uuid4
 
+from ampf.tasks import TaskMixin, TaskPatch, TaskStatus
 from pydantic import BaseModel, Field
 
 
 class ItemHeader(BaseModel):
     id: UUID = Field(default_factory=uuid4)
     title: str
+    processed_title: str | None = None
+    status: TaskStatus | None = None
+    error_message: str | None = None
+    scheduled_at: datetime | None = None
+    started_at: datetime | None = None
+    finished_at: datetime | None = None
     created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
     updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
```

```diff
-class ItemPatch(BaseModel):
+
+class ItemPatch(TaskPatch):
     title: str | None = None
+    processed_title: str | None = None
     content: str | None = None
 
 
-class Item(ItemHeader):
+class Item(ItemHeader, TaskMixin):
     content: str
 
     @classmethod
     def create(cls, value: ItemCreate) -> "Item":
-        return cls(**value.model_dump())
+        ret = cls(**value.model_dump())
+        ret.schedule()
+        return ret
+
+    def to_header(self) -> ItemHeader:
+        return ItemHeader.model_validate(self.model_dump(), extra="ignore")
```

#### /backend/app/features/items/item_service.py

```diff
 class ItemService:
     def __init__(self, storage: BaseAsyncCollectionStorage[Item]):
         self.storage = storage
+        self.timeout_in_minutes = 30
 
     async def post(self, value_create: ItemCreate) -> Item:
         value = Item.create(value_create)
+        value.schedule()
         await self.storage.create(value)
         return value
```

```diff
         async for v in self.storage.get_all():
             yield ItemHeader.model_validate(v.model_dump())
 
+    async def get_by_ids(self, ids: list[UUID]) -> AsyncGenerator[ItemHeader]:
+        timeout_threshold = datetime.now(UTC) - timedelta(minutes=self.timeout_in_minutes)
+        for id in ids:
+            try:
+                value = await self.storage.get(id)
+                if value.status == TaskStatus.RUNNING and (
+                    value.started_at is not None and value.started_at < timeout_threshold
+                ):
+                    value = await self.patch(id, value.finish("Timeout"))
+                yield value.to_header()
+            except KeyNotExistsException:
+                pass
+
     async def get(self, key: UUID) -> Item:
         return await self.storage.get(key)
```

```diff
         value = value.model_copy(update=dict_update)
         await self.storage.put(key, value)
 
-    async def patch(self, key: UUID, value_patch: ItemPatch) -> Item:
+    async def patch(self, key: UUID, value_patch: ItemPatch | TaskPatch) -> Item:
         dict_patch = value_patch.model_dump(exclude_unset=True)
         dict_patch["updated_at"] = datetime.now(UTC)
         return await self.storage.patch(key, dict_patch)
```

#### /backend/app/routers/items.py

```diff
 router = APIRouter(tags=["Items"])
 ITEM_PATH = "/{item_id}"
 
 
-@router.post("")
+@router.post("", status_code=202)
 async def post(dc: DependencyContainerDep, value_create: ItemCreate) -> Item:
     from features.items.item_service import ItemService
 
     service = dc.get(ItemService)
-    return await service.post(value_create)
+    task_runner = dc.get(TaskRunner)
+    item = await service.post(value_create)
+    await task_runner.run_async("task_name", item)
+    return item
 
 
+@TaskRegistry.register("task_name")
+async def process_item(item: Item) -> None:
+    processor = DependencyRegistry.get(ItemProcessor)
+    await processor(item)
+
+
@router.get("", response_model=list[ItemHeader])
-async def get_all(dc: DependencyContainerDep) -> list[ItemHeader]:
+async def get_all(dc: DependencyContainerDep, ids: Annotated[list[UUID] | None, Query()] = None):
     from features.items.item_service import ItemService
 
     service = dc.get(ItemService)
+    if ids is not None:
+        return JsonStreamingResponse(service.get_by_ids(ids))
     return JsonStreamingResponse(service.get_all())
```

#### backend/app/features/items/item_processor.py

```python
import asyncio
import logging

from ampf.dependency import DependencyRegistry
from features.items.item_model import Item, ItemPatch
from features.items.item_service import ItemService

_log = logging.getLogger(__name__)


@DependencyRegistry.register_class
class ItemProcessor:
    def __init__(self, service: ItemService):
        self.service = service

    async def __call__(self, item: Item) -> None:
        try:
            item = await self.service.patch(item.id, item.start())
            await asyncio.sleep(1)
            value_patch = ItemPatch(
                processed_title=item.title.upper(),
                **item.finish().model_dump(exclude_unset=True),
            )
            item = await self.service.patch(item.id, value_patch)
        except Exception as e:  # noqa: BLE001
            _log.exception("Item %s processing failed: %s", item.id, e)
            item = await self.service.patch(item.id, item.finish(str(e)))
```

### Tests

#### backend.tests/unit/routers/test_items.py

```diff
 def test_post_get_put_delete(client: ApiTestClient):
     # POST
     value_create = ItemCreate(title="X", content="xxx")
-    value = client.post_typed("/api/items", 200, Item, json=value_create)
+    value = client.post_typed("/api/items", 202, Item, json=value_create)
 
     # GET
     r = client.get_typed(f"/api/items/{value.id}", 200, Item)
```

```diff
+def test_post_get_by_ids(client: ApiTestClient):
+    # Given: Stored item
+    value_create = ItemCreate(title="X", content="xxx")
+    value = client.post_typed("/api/items", 202, Item, json=value_create)
+    # When: Get item list with id
+    headers = client.get_typed_list("/api/items", 200, ItemHeader, params={"ids": value.id})
+    # Then: The item is returned
+    assert len(headers) == 1
+    assert headers[0].title == value.title
+    # When: Get item list with any id
+    headers = client.get_typed_list("/api/items", 200, ItemHeader, params={"ids": uuid4()})
+    # Then: The list is empty
+    assert len(headers) == 0
+
+@pytest.mark.timeout(10)
+def test_async_process(client: ApiTestClient):
+    # When: An item ist posted
+    value_create = ItemCreate(title="title", content="xxx")
+    value = client.post_typed("/api/items", 202, Item, json=value_create)
+    # Then: The task is scheduled (or running because of DirectRunner in tests)
+    assert value.status in [TaskStatus.PENDING, TaskStatus.RUNNING]
+    assert value.scheduled_at is not None
+    # And: A status is pending or running until completed
+    while value.status and not value.status.is_finished():
+        sleep(0.1)
+        value = client.get_typed(f"/api/items/{value.id}", 200, Item)
+    # And: At then it is completed
+    assert value.status == TaskStatus.COMPLETED
+    assert value.started_at
+    assert value.finished_at
+    assert value.processed_title
+    assert value.processed_title == "TITLE"
```

## Frontend
