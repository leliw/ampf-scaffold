# Branch - CRUD - Doc

Simple CRUD feature where user can upload and download files with extra metadata stored in database. 

## Backend

### Application

* [document_model.py](./backend/app/features/documents/document_model.py)
* [document_service.py](./backend/app/features/documents/document_service.py)
* [routers/documents.py](./backend/app/routers/documents.py)
* [main.py](./backend/app/main.py)

    ```diff
    from log_config import setup_logging
    -from routers import auth, config, items, users
    +from routers import auth, config, documents, items, users
    from version import __version__
    ...
    app.include_router(items.router, prefix="/api/items")
    +app.include_router(documents.router, prefix="/api/documents")

    ```

* [strogage_def](./backend/app/storage_def.py)

    ```diff
    +from features.documents.document_model import Document
    from features.items.item_model import Item
    from features.markdowns.markdown_model import Markdown

    # fmt: off
    STORAGE_DEF: list[CollectionDef] = [
        CollectionDef("users", UserInDB, "username", subcollections=[
        ]),
        CollectionDef("items", Item),
        CollectionDef("markdowns", Markdown),
    +    CollectionDef("documents", Document),
    ]
    ```

### Tests

* [tests/unit/routers/test_documents.py](./backend/tests/unit/routers/test_documents.py)

## Frontend

### Keywords input component

* [keywords-input.ts](./frontend/src/app/shared/keywords-input/keywords-input.ts)
* [keywords-input.html](./frontend/src/app/shared/keywords-input/keywords-input.html)
* [keywords-input.scss](./frontend/src/app/shared/keywords-input/keywords-input.scss)

### File upload component

* [file-upload-container.ts](./frontend/src/app/shared/file-upload-container/file-upload-container.ts)
* [file-upload-container.html](./frontend/src/app/shared/file-upload-container/file-upload-container.html)
* [file-upload-container.scss](./frontend/src/app/shared/file-upload-container/file-upload-container.scss
* [app.config.ts](./frontend/src/app/app.config.ts)

    ```diff
    -import { provideHttpClient, withInterceptors } from '@angular/common/http';
    +import { provideHttpClient, withInterceptors, withXhr } from '@angular/common/http';
    import { routes } from './app.routes';
    import { authInterceptor } from './core/auth/auth.interceptor';
    import { ConfigService } from './core/config.service';

    export const appConfig: ApplicationConfig = {
    providers: [
    -    provideHttpClient(withInterceptors([authInterceptor])),
    +    provideHttpClient(withInterceptors([authInterceptor]), withXhr()),
    ```


## Frontend - features

* [document.service.ts](./frontend/src/app/features/documents/document.service.ts)
* [document-table.ts](./frontend/src/app/features/documents/document-table/document-table.ts)
* [document-table.html](./frontend/src/app/features/documents/document-table/document-table.html)
* [document-table.scss](./frontend/src/app/features/documents/document-table/document-table.scss)
* [document-edit.ts](./frontend/src/app/features/documents/document-edit/document-edit.ts)
* [document-edit.html](./frontend/src/app/features/documents/document-edit/document-edit.html)
* [document-edit.scss](./frontend/src/app/features/documents/document-edit/document-edit.scss)
* [app.routes.ts](./frontend/src/app/app.routes.ts)

    ```diff
    +    {
    +        path: 'documents', title: "Documents", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/documents/document-table/document-table').then(m => m.DocumentTable)
    +    },
    +    {
    +        path: 'documents/:documentId', title: "Edit document", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/documents/document-edit/document-edit').then(m => m.DocumentEdit),
    +    },
    ];    
    ```

* [navigation-bar.html](./frontend/src/app/core/navigation-bar/navigation-bar.html)

    ```diff
    +    <a mat-list-item routerLink="/documents">
    +        <mat-icon matListItemIcon>description</mat-icon>
    +        <span matListItemTitle>Documents</span>
    +    </a>
    ```
