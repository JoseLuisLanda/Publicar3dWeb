import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';

/**
 * Landing Page Component
 * Main entry point for the application
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatCardModule,
        MatIconModule,
        TranslateModule
    ],
    templateUrl: './landing.component.html',
    styleUrl: './landing.component.scss'
})
export class LandingComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    public translate = inject(TranslationService);

    currentUser$ = this.authService.currentUser$;

    ngOnInit() {
        // Optional: Logic to handle authenticated state
    }

    /**
     * Get current language code
     */
    currentLang(): string {
        return this.translate.getCurrentLanguage();
    }

    /**
     * Switch language
     */
    switchLanguage(lang: string) {
        this.translate.use(lang);
    }
}
