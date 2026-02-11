import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { User } from '@angular/fire/auth';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatIconModule,
        MatBadgeModule,
        TranslateModule
    ],
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.scss']
})
export class HomeComponent {
    private authService = inject(AuthService);
    private translate = inject(TranslateService);
    private router = inject(Router);

    currentUser = signal<User | null>(null);
    activeSection = signal<string>('dashboard');
    sidebarOpen = signal<boolean>(false);

    constructor() {
        // Subscribe to current user
        this.authService.currentUser$.subscribe(user => {
            this.currentUser.set(user);
        });
    }

    currentLang(): string {
        return this.translate.currentLang || this.translate.defaultLang || 'en';
    }

    switchLanguage(lang: string): void {
        this.translate.use(lang);
    }

    setActiveSection(section: string): void {
        this.activeSection.set(section);
        console.log('Active section:', section);

        // Navigate to specific routes for certain sections
        if (section === 'arExperiences') {
            this.router.navigate(['/ar-experiences']);
        }
        // Here you could implement routing or content switching for other sections
    }

    toggleSidebar(): void {
        this.sidebarOpen.update(v => !v);
    }

    closeSidebar(): void {
        this.sidebarOpen.set(false);
    }

    logout(): void {
        this.authService.signOut().then(() => {
            this.router.navigate(['/landing']);
        });
    }
}
