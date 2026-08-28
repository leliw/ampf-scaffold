import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Component, computed, forwardRef, input, model, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatChipEditedEvent, MatChipInputEvent, MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';

/**
 * A component for managing a list of keywords using Angular Material chips.
 * It implements ControlValueAccessor to integrate with Angular forms.
 * <!-- Usage:
 * <app-keywords-input [(ngModel)]="keywords" [label]="'Keywords'" [placeholder]="'Add a keyword'" [hint]="'Press Enter or comma to add'" [disabled]="isDisabled"></app-keywords-input>
 * -->
 */
@Component({
  selector: 'app-keywords-input',
  imports: [
    MatFormFieldModule,
    MatChipsModule,
    MatIconModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => KeywordsInput),
      multi: true
    }
  ],
  templateUrl: './keywords-input.html',
  styleUrl: './keywords-input.scss',
})
export class KeywordsInput implements ControlValueAccessor {
  /** Two-way bindable keywords list */
  readonly value = model<string[]>([]);

  /** Configuration for labels and placeholder */
  readonly label = input<string>('Keywords');
  readonly placeholder = input<string>('New keyword...');
  readonly hint = input<string>('Press Enter or comma to add');

  /** Configuration flags */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });
  readonly editable = input<boolean>(true);
  readonly removable = input<boolean>(true);

  /** Key codes triggering addition */
  readonly separatorKeyCodes = input<readonly number[]>([ENTER, COMMA]);

  private readonly formDisabled = signal<boolean>(false);
  readonly disabled = computed(() => this.disabledInput() || this.formDisabled());
  readonly keywords = computed(() => this.value() ?? []);

  private onChange: (value: string[]) => void = () => { };
  protected onTouched: () => void = () => { };

  writeValue(val: string[] | null): void {
    const safeVal = Array.isArray(val) ? val : [];
    const uniqueVal = safeVal.filter((item, index, self) =>
      index === self.findIndex(t => t.toLowerCase() === item.toLowerCase())
    );
    this.value.set(uniqueVal);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  private updateValue(newValue: string[]): void {
    this.value.set(newValue);
    this.onChange(newValue);
    this.onTouched();
  }

  add(event: MatChipInputEvent): void {
    if (this.disabled()) {
      return;
    }

    const rawValue = (event.value || '').trim();

    if (rawValue) {
      const currentList = this.keywords();
      const newItems = rawValue
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      const uniqueNewItems = newItems.filter((item, index, self) =>
        index === self.findIndex(t => t.toLowerCase() === item.toLowerCase())
      );

      const itemsToAdd = uniqueNewItems.filter(
        newItem => !currentList.some(existingItem => existingItem.toLowerCase() === newItem.toLowerCase())
      );

      if (itemsToAdd.length > 0) {
        this.updateValue([...currentList, ...itemsToAdd]);
      }
    }

    event.chipInput?.clear();
  }

  remove(index: number): void {
    if (this.disabled()) {
      return;
    }

    const currentList = this.keywords();
    if (index >= 0 && index < currentList.length) {
      const updated = [...currentList];
      updated.splice(index, 1);
      this.updateValue(updated);
    }
  }

  edit(index: number, event: MatChipEditedEvent): void {
    if (this.disabled()) {
      return;
    }

    const currentList = this.keywords();
    if (index < 0 || index >= currentList.length) {
      return;
    }

    const newValue = event.value.trim();
    const isDuplicate = currentList.some((item, i) => i !== index && item.toLowerCase() === newValue.toLowerCase());
    if (isDuplicate) {
      return;
    }

    if (!newValue) {
      this.remove(index);
      return;
    }

    const updated = [...currentList];
    updated[index] = newValue;
    this.updateValue(updated);
  }
}
