import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { TextFieldModule } from '@angular/cdk/text-field';
import { Component, DoCheck, ElementRef, OnDestroy, OnInit, Optional, Self, TemplateRef, ViewChild, ViewContainerRef, input } from '@angular/core';
import { ControlValueAccessor, FormControl, NgControl, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import Editor from '@toast-ui/editor';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-markdown-editor',
    templateUrl: './markdown-editor.component.html',
    styleUrls: ['./markdown-editor.component.scss'],
    imports: [
        ReactiveFormsModule,
        MatFormFieldModule,
        MatCardModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        TextFieldModule
    ]
})
export class MarkdownEditorComponent implements ControlValueAccessor, DoCheck, OnInit, OnDestroy {
    label = input('');
    placeholder = input('');
    minRows = input(5);
    maxRows = input(20);
    title = input('Editor');

    @ViewChild('fullscreenEditorTpl') fullscreenEditorTpl!: TemplateRef<any>;
    @ViewChild('editorHost', { static: false }) editorHost!: ElementRef<HTMLDivElement>;

    internalControl = new FormControl('');
    private overlayRef?: OverlayRef;
    private editorInstance: any;
    private sub!: Subscription;

    onChange: any = () => { };
    onTouch: any = () => { };
    private timeoutId?: ReturnType<typeof setTimeout>;

    constructor(
        @Optional() @Self() public ngControl: NgControl,
        private overlay: Overlay,
        private vcRef: ViewContainerRef
    ) {
        if (this.ngControl != null) {
            this.ngControl.valueAccessor = this;
        }
    }

    ngOnInit() {
        this.sub = this.internalControl.valueChanges.subscribe(val => {
            this.onChange(val);
        });
    }

    ngOnDestroy() {
        if (this.sub) {
            this.sub.unsubscribe();
        }
        this.closeFullscreen();
    }

    ngDoCheck() {
        if (this.ngControl) {
            if (this.ngControl.touched && !this.internalControl.touched) {
                this.internalControl.markAsTouched();
            }
            if (this.ngControl.errors !== this.internalControl.errors) {
                this.internalControl.setErrors(this.ngControl.errors);
            }
        }
    }

    writeValue(value: any): void {
        const val = value || '';
        this.internalControl.setValue(val, { emitEvent: false });
        if (this.editorInstance) {
            this.editorInstance.setMarkdown(val);
        }
    }

    registerOnChange(fn: any): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: any): void {
        this.onTouch = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        if (isDisabled) {
            this.internalControl.disable({ emitEvent: false });
        } else {
            this.internalControl.enable({ emitEvent: false });
        }
    }

    onBlur() {
        this.onTouch();
    }

    openFullscreen() {
        const positionStrategy = this.overlay.position()
            .global()
            .top('0')
            .left('0');

        this.overlayRef = this.overlay.create({
            width: '100vw',
            height: '100%',
            hasBackdrop: true,
            backdropClass: 'dark-backdrop',
            positionStrategy,
            scrollStrategy: this.overlay.scrollStrategies.block()
        });

        const portal = new TemplatePortal(
            this.fullscreenEditorTpl,
            this.vcRef
        );

        this.overlayRef.attach(portal);
        this.overlayRef.backdropClick().subscribe(() => this.closeFullscreen());
        this.timeoutId = setTimeout(() => {
            if (this.overlayRef?.hasAttached() && this.editorHost) {
                this.createEditor();
            }
        }, 0);
        this.overlayRef.keydownEvents().subscribe(event => {
            if (event.key === 'Escape') {
                this.closeFullscreen();
            }
        });
    }

    closeFullscreen() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.editorInstance) {
            this.editorInstance.destroy();
            this.editorInstance = null;
        }
        if (this.overlayRef) {
            this.overlayRef.detach();
            this.overlayRef.dispose();
            this.overlayRef = undefined;
        }
        this.onTouch();
    }

    createEditor() {
        this.editorInstance = new Editor({
            el: this.editorHost.nativeElement,
            height: '100%',
            initialEditType: 'markdown',
            initialValue: this.internalControl.value || '',
            previewStyle: 'tab',
            usageStatistics: false,
            hooks: {
                change: () => {
                    const val = this.editorInstance.getMarkdown();
                    this.internalControl.setValue(val);
                }
            }
        });
    }
}
