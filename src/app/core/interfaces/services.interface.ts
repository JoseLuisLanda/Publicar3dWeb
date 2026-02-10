import { Observable } from 'rxjs';

/**
 * Generic repository interface following Repository Pattern
 * Implements Interface Segregation Principle (ISP)
 * Allows for Dependency Inversion Principle (DIP)
 */
export interface IRepository<T> {
    getAll(): Observable<T[]>;
    getById(id: string): Observable<T | null>;
    create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Observable<T>;
    update(id: string, item: Partial<T>): Observable<void>;
    delete(id: string): Observable<void>;
}

/**
 * Authentication service interface
 * Following Interface Segregation Principle
 */
export interface IAuthService {
    readonly currentUser$: Observable<any | null>;
    readonly isAuthenticated$: Observable<boolean>;

    signIn(email: string, password: string): Promise<void>;
    signUp(email: string, password: string, displayName?: string): Promise<void>;
    signOut(): Promise<void>;
    resetPassword(email: string): Promise<void>;
    updateProfile(data: { displayName?: string; photoURL?: string }): Promise<void>;
}

/**
 * Translation service interface
 * Following Interface Segregation Principle
 */
export interface ITranslationService {
    readonly currentLang$: Observable<string>;

    setLanguage(lang: string): void;
    translate(key: string, params?: any): Observable<string>;
    instant(key: string, params?: any): string;
    getSupportedLanguages(): string[];
}

/**
 * Storage service interface for file uploads
 */
export interface IStorageService {
    upload(path: string, file: File): Observable<{ url: string; progress: number }>;
    delete(path: string): Promise<void>;
    getDownloadURL(path: string): Promise<string>;
}

/**
 * Logger service interface
 * Following Single Responsibility Principle
 */
export interface ILogger {
    log(message: string, ...args: any[]): void;
    error(message: string, error?: any): void;
    warn(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
}

/**
 * Notification service interface
 */
export interface INotificationService {
    success(message: string, title?: string): void;
    error(message: string, title?: string): void;
    warning(message: string, title?: string): void;
    info(message: string, title?: string): void;
}
