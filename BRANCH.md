# Branch - CRUD - Markdown

CRUD with Markdown field. It is mostly the same as basic CRUD.

## Backend

### Application

* [markdown_model.py](./backend/app/features/markdowns/markdown_model.py)
* [markdown_service.py](./backend/app/features/markdowns/markdown_service.py)
* [storage_def.py](./backend/app/storage_def.py)
* [routers/markdowns.py](./backend/app/routers/markdowns.py)
* [main.py](./backend/app/main.py)

### Tests

* [tests/unit/routers/test_markdowns.py](./backend/tests/unit/routers/test_markdowns.py)

## Frontend - TOAST UI Editor

Install TOAST UI Editor.

```bash
npm install @toast-ui/editor --force
```

* [toast-ui-editor.d.ts](./frontend/src/app/toast-ui-editor.d.ts)
* [angular.json](./frontend/angular.json)

    ```diff
    "styles": [
    -    "src/styles.scss"
    +   "src/styles.scss",
    +    "node_modules/@toast-ui/editor/dist/toastui-editor.css"
    ]
    ```
