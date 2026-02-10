import { Component, Input, forwardRef, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

/**
 * Reusable Input Field Component
 * Implements ControlValueAccessor for form integration
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-input-field',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule
    ],
    template: `
    <mat-form-field appearance="outline" class="w-full">
      <mat-label>{{ label }}</mat-label>
      
      @if (prefixIcon) {
        <mat-icon matPrefix>{{ prefixIcon }}</mat-icon>
      }
      
      <input
        matInput
        [type]="inputType()"
        [placeholder]="placeholder"
        [value]="value"
        [disabled]="disabled"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      
      @if (type === 'password') {
        <button
          mat-icon-button
          matSuffix
          type="button"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="'Toggle password visibility'"
        >
          <mat-icon>{{ showPassword() ? 'visibility_off' : 'visibility' }}</mat-icon>
        </button>
      }
      
      @if (errorMessage) {
        <mat-error>{{ errorMessage }}</mat-error>
      }
    </mat-form-field>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .w-full {
      width: 100%;
    }

    mat-form-field {
      font-size: 16px;
    }
  `],
    providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => InputFieldComponent),
            multi: true
        }
    ]
})
export class InputFieldComponent implements ControlValueAccessor {
    @Input() label = '';
    @Input() placeholder = '';
    @Input() type: 'text' | 'email' | 'password' = 'text';
    @Input() prefixIcon?: string;
    @Input() errorMessage?: string;

    value = '';
    disabled = false;
    showPassword = signal(false);

    private onChange: (value: string) => void = () => { };
    onTouched: () => void = () => { };

    inputType = signal<string>(this.type);

    ngOnInit() {
        this.inputType.set(this.type);
    }

    togglePasswordVisibility() {
        this.showPassword.update(v => !v);
        this.inputType.set(this.showPassword() ? 'text' : 'password');
    }

    onInput(event: Event) {
        const value = (event.target as HTMLInputElement).value;
        this.value = value;
        this.onChange(value);
    }

    writeValue(value: string): void {
        this.value = value || '';
    }

    registerOnChange(fn: (value: string) => void): void {
        this.onChange = fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched = fn;
    }

    setDisabledState(isDisabled: boolean): void {
        this.disabled = isDisabled;
    }
}
