import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

/**
 * Reusable Button Component
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-button',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        MatIconModule
    ],
    template: `
    <button
      [type]="type"
      [disabled]="disabled || loading()"
      [class]="buttonClass()"
      (click)="handleClick($event)"
    >
      @if (loading()) {
        <mat-spinner diameter="20" class="spinner"></mat-spinner>
      }
      
      @if (!loading() && icon) {
        <mat-icon>{{ icon }}</mat-icon>
      }
      
      @if (!loading()) {
        <span class="button-text">{{ text }}</span>
      }
    </button>
  `,
    styles: [`
    button {
      position: relative;
      min-width: 120px;
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 500;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }

    .secondary {
      background: #f5f5f5;
      color: #333;
    }

    .secondary:hover:not(:disabled) {
      background: #e0e0e0;
    }

    .outline {
      background: transparent;
      border: 2px solid #667eea;
      color: #667eea;
    }

    .outline:hover:not(:disabled) {
      background: rgba(102, 126, 234, 0.1);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .spinner {
      margin: 0 auto;
    }

    .button-text {
      line-height: 1;
    }

    mat-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
    }
  `]
})
export class ButtonComponent {
    @Input() text = '';
    @Input() type: 'button' | 'submit' = 'button';
    @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
    @Input() disabled = false;
    @Input() icon?: string;
    @Input() loading = signal(false);

    @Output() clicked = new EventEmitter<Event>();

    buttonClass = signal('primary');

    ngOnInit() {
        this.buttonClass.set(this.variant);
    }

    handleClick(event: Event) {
        if (!this.disabled && !this.loading()) {
            this.clicked.emit(event);
        }
    }
}
