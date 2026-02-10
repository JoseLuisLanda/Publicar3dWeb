import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * Forgot Password Component
 * Handles password reset requests
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatIconModule,
        TranslateModule,
        InputFieldComponent,
        ButtonComponent
    ],
    templateUrl: './forgot-password.component.html',
    styleUrl: './forgot-password.component.scss'
})
export class ForgotPasswordComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private translate = inject(TranslationService);

    resetForm!: FormGroup;
    loading = signal(false);
    errorMessage = signal('');
    successMessage = signal('');

    ngOnInit() {
        this.initForm();
    }

    /**
     * Initialize reset form
     */
    private initForm() {
        this.resetForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]]
        });
    }

    /**
     * Get form control error message
     */
    getErrorMessage(controlName: string): string {
        const control = this.resetForm.get(controlName);

        if (!control || !control.errors || !control.touched) {
            return '';
        }

        if (control.errors['required']) {
            return this.translate.instant('auth.errors.required');
        }

        if (control.errors['email']) {
            return this.translate.instant('auth.errors.invalidEmail');
        }

        return '';
    }

    /**
     * Handle form submission
     */
    async onSubmit() {
        if (this.resetForm.invalid) {
            this.resetForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');
        this.successMessage.set('');

        const { email } = this.resetForm.value;

        try {
            await this.authService.resetPassword(email);

            // Show success message
            this.successMessage.set(
                this.translate.instant('auth.forgotPassword.successMessage')
            );

            // Clear form
            this.resetForm.reset();
        } catch (error: any) {
            this.errorMessage.set(this.getAuthErrorMessage(error.message));
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Convert Firebase auth error to user-friendly message
     */
    private getAuthErrorMessage(error: string): string {
        const errorMap: Record<string, string> = {
            'User not found': 'auth.errors.userNotFound',
            'Invalid email address': 'auth.errors.invalidEmail'
        };

        const key = errorMap[error] || 'auth.errors.generic';
        return this.translate.instant(key);
    }
}
