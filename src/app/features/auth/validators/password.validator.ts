import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Password Strength Validator
 * Validates password meets security requirements
 * Following Single Responsibility Principle
 */
export function passwordStrengthValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const value = control.value;

        if (!value) {
            return null;
        }

        const hasMinLength = value.length >= 8;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumber = /[0-9]/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        const passwordValid = hasMinLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;

        if (!passwordValid) {
            return {
                passwordStrength: {
                    hasMinLength,
                    hasUpperCase,
                    hasLowerCase,
                    hasNumber,
                    hasSpecialChar
                }
            };
        }

        return null;
    };
}

/**
 * Password Match Validator
 * Validates that password and confirm password match
 * Should be applied to the form group, not individual controls
 */
export function passwordMatchValidator(passwordField: string, confirmPasswordField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        const password = control.get(passwordField);
        const confirmPassword = control.get(confirmPasswordField);

        if (!password || !confirmPassword) {
            return null;
        }

        if (confirmPassword.errors && !confirmPassword.errors['passwordMismatch']) {
            return null;
        }

        if (password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
            return { passwordMismatch: true };
        } else {
            confirmPassword.setErrors(null);
            return null;
        }
    };
}

/**
 * Calculate password strength score (0-100)
 * Used for password strength meter
 */
export function calculatePasswordStrength(password: string): number {
    if (!password) return 0;

    let strength = 0;

    // Length check (0-40 points)
    if (password.length >= 8) strength += 20;
    if (password.length >= 12) strength += 10;
    if (password.length >= 16) strength += 10;

    // Character variety (0-60 points)
    if (/[a-z]/.test(password)) strength += 15;
    if (/[A-Z]/.test(password)) strength += 15;
    if (/[0-9]/.test(password)) strength += 15;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 15;

    return Math.min(strength, 100);
}

/**
 * Get password strength label
 */
export function getPasswordStrengthLabel(strength: number): string {
    if (strength === 0) return 'none';
    if (strength < 40) return 'weak';
    if (strength < 70) return 'medium';
    if (strength < 90) return 'strong';
    return 'veryStrong';
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(strength: number): string {
    if (strength === 0) return '#ccc';
    if (strength < 40) return '#f44336'; // red
    if (strength < 70) return '#ff9800'; // orange
    if (strength < 90) return '#2196f3'; // blue
    return '#4caf50'; // green
}
