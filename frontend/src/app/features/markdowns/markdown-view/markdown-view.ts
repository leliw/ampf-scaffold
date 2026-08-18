import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from '@angular/router';
import { NavigationBar } from '../../../core/navigation-bar/navigation-bar';
import { MarkdownPipe } from "../../../shared/markdown.pipe";
import { MarkdownService } from '../markdown.service';

@Component({
    selector: 'app-markdown-view',
    imports: [
        RouterModule,
        MatButtonModule,
        MatIconModule,
        NavigationBar,
        MarkdownPipe,
    ],
    templateUrl: './markdown-view.html',
    styleUrl: './markdown-view.scss',
})
export class MarkdownView {
    markdownId = input.required<string>();

    private markdownService = inject(MarkdownService);

    resource = rxResource({
        params: () => {
            const markdownId = this.markdownId();
            return markdownId != "__NEW__" ? ({ markdownId: markdownId }) : undefined;
        },
        stream: ({ params }) => this.markdownService.get(params.markdownId)
    });
}
