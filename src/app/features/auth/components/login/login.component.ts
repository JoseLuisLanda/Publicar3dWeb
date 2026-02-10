import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

/**
 * Login Component
 * Handles user authentication
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
        MatIconModule,
        TranslateModule,
        InputFieldComponent,
        ButtonComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private translate = inject(TranslationService);

    loginForm!: FormGroup;
    loading = signal(false);
    errorMessage = signal('');

    ngOnInit() {
        this.initForm();
    }

    /**
     * Initialize login form
     */
    private initForm() {
        this.loginForm = this.fb.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            rememberMe: [false]
        });
    }

    /**
     * Get form control error message
     */
    getErrorMessage(controlName: string): string {
        const control = this.loginForm.get(controlName);

        if (!control || !control.errors || !control.touched) {
            return '';
        }

        if (control.errors['required']) {
            return this.translate.instant('auth.errors.required');
        }

        if (control.errors['email']) {
            return this.translate.instant('auth.errors.invalidEmail');
        }

        if (control.errors['minlength']) {
            return this.translate.instant('auth.errors.minLength', { min: 6 });
        }

        return '';
    }

    /**
     * Handle form submission
     */
    async onSubmit() {
        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        const { email, password, rememberMe } = this.loginForm.value;

        try {
            await this.authService.signIn(email, password);

            // Store remember me preference
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }

            // Redirect to dashboard or return URL
            const returnUrl = this.getReturnUrl();
            this.router.navigate([returnUrl]);
        } catch (error: any) {
            this.errorMessage.set(this.getAuthErrorMessage(error.message));
        } finally {
            this.loading.set(false);
        }
    }

    /**
     * Get return URL from query params or default to dashboard
     */
    private getReturnUrl(): string {
        // TODO: Get from ActivatedRoute query params
        return '/home';
    }

    /**
     * Convert Firebase auth error to user-friendly message
     */
    private getAuthErrorMessage(error: string): string {
        const errorMap: Record<string, string> = {
            'User not found': 'auth.errors.userNotFound',
            'Invalid password': 'auth.errors.invalidPassword',
            'Too many requests. Try again later': 'auth.errors.tooManyRequests',
            'Invalid email address': 'auth.errors.invalidEmail'
        };

        const key = errorMap[error] || 'auth.errors.generic';
        return this.translate.instant(key);
    }

    /**
     * Handle Google login
     */
    async loginWithGoogle() {
        this.loading.set(true);
        this.errorMessage.set('');

        try {
            await this.authService.signInWithGoogle();
            const returnUrl = this.getReturnUrl();
            this.router.navigate([returnUrl]);
        } catch (error: any) {
            this.errorMessage.set(this.getAuthErrorMessage(error.message));
        } finally {
            this.loading.set(false);
        }
    }

    async loginWithFacebook() {
        // TODO: Implement Facebook login
        console.log('Facebook login not implemented yet');
    }
}
