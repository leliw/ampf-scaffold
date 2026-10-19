# CRUD Dynamic Table

 A simple frontend table dynamically generated from a Pydantic model definition.

## Backend

#### [backend/app/features/items/item_model.py](backend/app/features/items/item_model.py)

Add title to fields.

```diff
 class ItemHeader(BaseModel):
     id: UUID = Field(default_factory=uuid4)
-    title: str
-    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
-    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
+    title: str = Field(title="Title")
+    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC), title="Created at")
+    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC), title="Updated at")

```

#### [backend/app/routers/items2.py](backend/app/routers/items2.py)

Add table definition and endpoint.

```diff
+@router.get("/definition/table", response_model_exclude_none=True)
+def get_definition_table() -> TableDefinition:
+    return TableDefinition(
+        actions=[],
+        columns=[ColumnDefinition.from_field_info(k, m) for k, m in ItemHeader.model_fields.items()],
+    )

@router.get("", response_model=list[ItemHeader])
async def get_headers(dc: DependencyContainerDep) -> JsonStreamingResponse:
    from features.items.item_service import ItemService

    service = dc.get(ItemService)
    return JsonStreamingResponse(service.get_headers())
```


## Frontend

- [frontend/src/app/shared/dynamic-table-client-side/table-definition.service.ts](frontend/src/app/shared/dynamic-table-client-side/table-definition.service.ts)
- [frontend/src/app/shared/dynamic-table-client-side/dynamic-table-client-side.ts](frontend/src/app/shared/dynamic-table-client-side/dynamic-table-client-side.ts)
- [frontend/src/app/shared/dynamic-table-client-side/dynamic-table-client-side.html](frontend/src/app/shared/dynamic-table-client-side/dynamic-table-client-side.html)
- [frontend/src/app/core/main-layout/main-layout.ts](frontend/src/app/core/main-layout/main-layout.ts)
- [frontend/src/app/core/main-layout/main-layout.html](frontend/src/app/core/main-layout/main-layout.html)


#### frontend/src/app/app.routes.ts

```diff
-import { Routes } from '@angular/router';
+import { ResolveFn, Routes } from '@angular/router';
 import { authGuard } from './core/auth/auth.guard';
+import { MainLayout } from './core/main-layout/main-layout';
+
+
+const crudTitle: ResolveFn<string> = route => {
+    const name = route.paramMap.get('crudName') ?? 'Items';
+    const label = name
+        .replace(/[-_]/g, ' ')
+        .replace(/\b\w/g, char => char.toUpperCase());
+
+    const recordId = route.paramMap.get('recordId');
+
+    if (!recordId) return label;
+    return recordId === '__NEW__' ? `New ${label}` : `Edit ${label}`;
+};
 
 export const routes: Routes = [
     { path: '', redirectTo: 'home', pathMatch: 'full' },
```

```diff
         path: 'items/:itemId', title: "Edit item", canActivate: [authGuard], data: { roles: ['user'] },
         loadComponent: () => import('./features/items/item-edit/item-edit').then(m => m.ItemEdit)
     },
+    {
+        path: ':crudName', component: MainLayout, children: [
+            { path: '', title: crudTitle, loadComponent: () => import('./shared/dynamic-table-client-side/dynamic-table-client-side').then(m => m.DynamicTableClientSide) }
+        ]
+    },
+
 ];
```
