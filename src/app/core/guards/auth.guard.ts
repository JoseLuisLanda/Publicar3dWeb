import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * Auth Guard - Functional Guard (Angular 15+)
 * Implements Single Responsibility Principle (SRP) - Only checks authentication
 * Uses modern functional guard approach instead of class-based guards
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isAuthenticated$.pipe(
        take(1),
        map(isAuthenticated => {
            if (isAuthenticated) {
                return true;
            }

            // Store the attempted URL for redirecting after login
            const returnUrl = state.url;
            router.navigate(['/login'], { queryParams: { returnUrl } });
            return false;
        })
    );
};

/**
 * Guest Guard - Only allows unauthenticated users
 * Useful for login/register pages
 */
export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.isAuthenticated$.pipe(
        take(1),
        map(isAuthenticated => {
            if (!isAuthenticated) {
                return true;
            }

            // User is already authenticated, redirect to home
            router.navigate(['/home']);
            return false;
        })
    );
};

/**
 * Admin Guard - Only allows admin users
 * Requires role-based authentication
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    return authService.currentUser$.pipe(
        take(1),
        map(user => {
            // TODO: Implement role checking when user model includes roles
            // For now, just check if user is authenticated
            if (user) {
                // Check if user has admin role
                // const hasAdminRole = user.role === 'admin';
                // if (hasAdminRole) return true;
                return true; // Temporary - allow all authenticated users
            }

            router.navigate(['/login']);
            return false;
        })
    );
};
