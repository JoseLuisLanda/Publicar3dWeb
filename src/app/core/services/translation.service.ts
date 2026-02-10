import { Injectable, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { ITranslationService } from '../interfaces/services.interface';
import { environment } from '../../../environments/environment';

/**
 * Translation Service Wrapper
 * Implements Single Responsibility Principle (SRP) - Only handles translations
 * Implements Dependency Inversion Principle (DIP) - Depends on ITranslationService interface
 * Wraps ngx-translate for better control and testability
 */
@Injectable({
    providedIn: 'root'
})
export class TranslationService implements ITranslationService {
    private translateService = inject(TranslateService);
    private currentLangSubject = new BehaviorSubject<string>(environment.defaultLanguage);

    /**
     * Observable of current language
     */
    readonly currentLang$: Observable<string> = this.currentLangSubject.asObservable();

    constructor() {
        this.initializeLanguage();
    }

    /**
     * Initialize language from localStorage or use default
     * Following Single Responsibility Principle
     */
    private initializeLanguage(): void {
        const savedLang = localStorage.getItem('preferredLanguage');
        const langToUse = savedLang && this.isLanguageSupported(savedLang)
            ? savedLang
            : environment.defaultLanguage;

        this.translateService.setDefaultLang(environment.defaultLanguage);
        this.setLanguage(langToUse);
    }

    /**
     * Set current language
     * @param lang Language code (en, es)
     */
    setLanguage(lang: string): void {
        if (!this.isLanguageSupported(lang)) {
            console.warn(`Language ${lang} not supported. Using default.`);
            lang = environment.defaultLanguage;
        }

        this.translateService.use(lang);
        this.currentLangSubject.next(lang);
        localStorage.setItem('preferredLanguage', lang);
    }

    /**
     * Alias for setLanguage to match TranslateService API
     * @param lang Language code (en, es)
     */
    use(lang: string): void {
        this.setLanguage(lang);
    }

    /**
     * Get translation as Observable
     * @param key Translation key
     * @param params Optional parameters for interpolation
     */
    translate(key: string, params?: any): Observable<string> {
        return this.translateService.get(key, params);
    }

    /**
     * Get translation instantly (synchronous)
     * @param key Translation key
     * @param params Optional parameters for interpolation
     */
    instant(key: string, params?: any): string {
        return this.translateService.instant(key, params);
    }

    /**
     * Get list of supported languages
     */
    getSupportedLanguages(): string[] {
        return environment.supportedLanguages;
    }

    /**
     * Get current language code
     */
    getCurrentLanguage(): string {
        return this.currentLangSubject.value;
    }

    /**
     * Check if language is supported
     * @param lang Language code to check
     */
    private isLanguageSupported(lang: string): boolean {
        return environment.supportedLanguages.includes(lang);
    }
}
