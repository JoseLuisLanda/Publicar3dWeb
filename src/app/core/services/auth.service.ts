import { Injectable, inject } from '@angular/core';
import {
    Auth,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    sendPasswordResetEmail,
    updateProfile as firebaseUpdateProfile,
    User,
    authState,
    GoogleAuthProvider,
    signInWithPopup
} from '@angular/fire/auth';
import { Observable, map } from 'rxjs';
import { IAuthService } from '../interfaces/services.interface';

/**
 * Authentication Service
 * Implements Single Responsibility Principle (SRP) - Only handles authentication
 * Implements Dependency Inversion Principle (DIP) - Depends on IAuthService interface
 * Uses Angular's modern inject() function for dependency injection
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService implements IAuthService {
    private auth = inject(Auth);

    /**
     * Observable of the current user state
     */
    readonly currentUser$: Observable<User | null> = authState(this.auth);

    /**
     * Observable indicating if user is authenticated
     */
    readonly isAuthenticated$: Observable<boolean> = this.currentUser$.pipe(
        map(user => !!user)
    );

    /**
     * Get current user synchronously
     */
    get currentUser(): User | null {
        return this.auth.currentUser;
    }

    /**
     * Sign in with email and password
     * @param email User email
     * @param password User password
     */
    async signIn(email: string, password: string): Promise<void> {
        try {
            await signInWithEmailAndPassword(this.auth, email, password);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Sign up new user with email and password
     * @param email User email
     * @param password User password
     * @param displayName Optional display name
     */
    async signUp(email: string, password: string, displayName?: string): Promise<void> {
        try {
            const credential = await createUserWithEmailAndPassword(this.auth, email, password);

            if (displayName && credential.user) {
                await firebaseUpdateProfile(credential.user, { displayName });
            }
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Sign out current user
     */
    async signOut(): Promise<void> {
        try {
            await firebaseSignOut(this.auth);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Send password reset email
     * @param email User email
     */
    async resetPassword(email: string): Promise<void> {
        try {
            await sendPasswordResetEmail(this.auth, email);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Sign in with Google
     * Opens a popup for Google authentication
     */
    async signInWithGoogle(): Promise<void> {
        try {
            const provider = new GoogleAuthProvider();
            await signInWithPopup(this.auth, provider);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Update user profile
     * @param data Profile data to update
     */
    async updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void> {
        const user = this.currentUser;
        if (!user) {
            throw new Error('No user logged in');
        }

        try {
            await firebaseUpdateProfile(user, data);
        } catch (error) {
            this.handleAuthError(error);
        }
    }

    /**
     * Handle authentication errors
     * Following Single Responsibility Principle
     * @param error Firebase auth error
     */
    private handleAuthError(error: any): never {
        const errorCode = error?.code || 'unknown';
        const errorMessages: Record<string, string> = {
            'auth/user-not-found': 'User not found',
            'auth/wrong-password': 'Invalid password',
            'auth/email-already-in-use': 'Email already in use',
            'auth/weak-password': 'Password is too weak',
            'auth/invalid-email': 'Invalid email address',
            'auth/too-many-requests': 'Too many requests. Try again later',
            'auth/popup-closed-by-user': 'Sign-in popup was closed',
            'auth/cancelled-popup-request': 'Only one popup request is allowed at a time',
            'auth/popup-blocked': 'Sign-in popup was blocked by the browser'
        };

        const message = errorMessages[errorCode] || 'Authentication error occurred';
        throw new Error(message);
    }
}
