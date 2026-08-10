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

## Frontend - Marked & marked-highlight

Install Marked & marked-highlight.

```bash
npm install marked
npm install marked-highlight
npm install highlight.js
```

## Frontend - shared

* [markdown-editor.component.ts](./frontend/src/app/shared/markdown-editor/markdown-editor.component.ts)
* [markdown-editor.component.html](./frontend/src/app/shared/markdown-editor/markdown-editor.component.html)
* [markdown-editor.component.scss](./frontend/src/app/shared/markdown-editor/markdown-editor.component.scss)
* [markdown.pipe.ts](./frontend/src/app/shared/markdown.pipe.ts)

## Frontend - features

* [markdown.service.ts](./frontend/src/app/features/markdowns/markdown.service.ts)
* [markdown-table.html](./frontend/src/app/features/markdowns/markdown-table/markdown-table.html)
* [markdown-table.ts](./frontend/src/app/features/markdowns/markdown-table/markdown-table.ts)
* [markdown-edit.html](./frontend/src/app/features/markdowns/markdown-edit/markdown-edit.html)
* [markdown-edit.ts](./frontend/src/app/features/markdowns/markdown-edit/markdown-edit.ts)
* [markdown-view.html](./frontend/src/app/features/markdowns/markdown-view/markdown-view.html)
* [markdown-view.ts](./frontend/src/app/features/markdowns/markdown-view/markdown-view.ts)
* [markdown-view.scss](./frontend/src/app/features/markdowns/markdown-view/markdown-view.scss)
* [app.routes.ts](./frontend/src/app/app.routes.ts)

    ```diff
        },
    +    {
    +        path: 'markdowns', title: "Markdowns", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/markdowns/markdown-table/markdown-table').then(m => m.MarkdownTable)
    +    },
    +    {
    +        path: 'markdowns/:markdownId', title: "View markdown", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/markdowns/markdown-view/markdown-view').then(m => m.MarkdownView)
    +    },
    +    {
    +        path: 'markdowns/:markdownId/edit', title: "Edit markdown", canActivate: [authGuard], data: { roles: ['user'] },
    +        loadComponent: () => import('./features/markdowns/markdown-edit/markdown-edit').then(m => m.MarkdownEdit)
    +    },
    ];
    ```

* [navigation-bar.ts](./frontend/src/app/core/navigation-bar/navigation-bar.ts)

    ```diff
        </a>
    +    <a mat-list-item routerLink="/markdowns">
    +        <mat-icon matListItemIcon>wysiwyg</mat-icon>
    +        <span matListItemTitle>Markdowns</span>
    +    </a>
        <a mat-list-item [matMenuTriggerFor]="menu">
    ```
