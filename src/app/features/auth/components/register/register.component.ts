import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../../../core/services/auth.service';
import { TranslationService } from '../../../../core/services/translation.service';
import { InputFieldComponent } from '../../../../shared/components/input-field/input-field.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import {
    passwordStrengthValidator,
    passwordMatchValidator,
    calculatePasswordStrength,
    getPasswordStrengthLabel,
    getPasswordStrengthColor
} from '../../validators/password.validator';

/**
 * Registration Component
 * Handles user registration with password strength validation
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-register',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterModule,
        MatCardModule,
        MatCheckboxModule,
        MatDividerModule,
        MatIconModule,
        MatProgressBarModule,
        TranslateModule,
        InputFieldComponent,
        ButtonComponent
    ],
    templateUrl: './register.component.html',
    styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private translate = inject(TranslationService);

    registerForm!: FormGroup;
    loading = signal(false);
    errorMessage = signal('');
    passwordStrength = signal(0);

    // Computed properties for password strength
    strengthLabel = computed(() => {
        const label = getPasswordStrengthLabel(this.passwordStrength());
        return this.translate.instant(`auth.register.passwordStrength.${label}`);
    });

    strengthColor = computed(() => getPasswordStrengthColor(this.passwordStrength()));

    ngOnInit() {
        this.initForm();
        this.setupPasswordStrengthMonitoring();
    }

    /**
     * Initialize registration form with validators
     */
    private initForm() {
        this.registerForm = this.fb.group({
            displayName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, passwordStrengthValidator()]],
            confirmPassword: ['', [Validators.required]],
            agreeToTerms: [false, [Validators.requiredTrue]]
        }, {
            validators: [passwordMatchValidator('password', 'confirmPassword')]
        });
    }

    /**
     * Monitor password field changes to update strength meter
     */
    private setupPasswordStrengthMonitoring() {
        this.registerForm.get('password')?.valueChanges.subscribe(password => {
            this.passwordStrength.set(calculatePasswordStrength(password || ''));
        });
    }

    /**
     * Get form control error message
     */
    getErrorMessage(controlName: string): string {
        const control = this.registerForm.get(controlName);

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
            const minLength = control.errors['minlength'].requiredLength;
            return this.translate.instant('auth.errors.minLength', { min: minLength });
        }

        if (control.errors['passwordStrength']) {
            return this.translate.instant('auth.errors.weakPassword');
        }

        if (control.errors['passwordMismatch']) {
            return this.translate.instant('auth.errors.passwordMismatch');
        }

        return '';
    }

    /**
     * Get terms checkbox error
     */
    getTermsError(): string {
        const control = this.registerForm.get('agreeToTerms');
        if (control?.touched && control?.errors?.['required']) {
            return this.translate.instant('auth.errors.termsRequired');
        }
        return '';
    }

    /**
     * Handle form submission
     */
    async onSubmit() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.loading.set(true);
        this.errorMessage.set('');

        const { email, password, displayName } = this.registerForm.value;

        try {
            await this.authService.signUp(email, password, displayName);

            // Redirect to dashboard after successful registration
            this.router.navigate(['/home']);
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
            'Email already in use': 'auth.errors.emailInUse',
            'Invalid email address': 'auth.errors.invalidEmail',
            'Password is too weak': 'auth.errors.weakPassword'
        };

        const key = errorMap[error] || 'auth.errors.generic';
        return this.translate.instant(key);
    }

    /**
     * Handle Google registration/login
     */
    async registerWithGoogle() {
        this.loading.set(true);
        this.errorMessage.set('');

        try {
            await this.authService.signInWithGoogle();
            this.router.navigate(['/home']);
        } catch (error: any) {
            this.errorMessage.set(this.getAuthErrorMessage(error.message));
        } finally {
            this.loading.set(false);
        }
    }

    async registerWithFacebook() {
        // TODO: Implement Facebook registration
        console.log('Facebook registration not implemented yet');
    }
}
