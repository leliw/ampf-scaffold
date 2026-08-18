# Branch - CRUD - File

Simple CRUD feature with file upload/download functionality.

## Backend

### Application

* [file_model.py](./backend/app/features/files/file_model.py)
* [file_service.py](./backend/app/features/files/file_service.py)
* [routers/files.py](./backend/app/routers/files.py)
* [main.py](./backend/app/main.py)

    ```diff
    from log_config import setup_logging
    -from routers import auth, config, items, users
    +from routers import auth, config, files, items, users
    from version import __version__
    ...
    app.include_router(items.router, prefix="/api/items")
    +app.include_router(files.router, prefix="/api/files")

    ```
### Tests

* [tests/unit/routers/test_files.py](./backend/tests/unit/routers/test_files.py)


## Frontend - features

* [file.service.ts](./frontend/src/app/features/files/file.service.ts)
* [file-table.html](./frontend/src/app/features/files/file-table/file-table.html)
* [file-table.ts](./frontend/src/app/features/files/file-table/file-table.ts)
* [app.routes.ts](./frontend/src/app/app.routes.ts)

    ```diff
        },
    +    {
    +        path: 'files', title: "Files", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/files/file-table/file-table').then(m => m.fileTable)
    +    },
    ];
    ```

* [navigation-bar.html](./frontend/src/app/core/navigation-bar/navigation-bar.html)

    ```diff
    +    <a mat-list-item routerLink="/files">
    +        <mat-icon matListItemIcon>file_present</mat-icon>
    +        <span matListItemTitle>Files</span>
    +    </a>
    ```
