import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { TranslateModule } from '@ngx-translate/core';

import { AuthService } from '../../core/services/auth.service';
import { TranslationService } from '../../core/services/translation.service';
import type { User as FirebaseUser } from '@angular/fire/auth';

/**
 * Dashboard Component
 * Main dashboard for authenticated users
 * Following Single Responsibility Principle
 */
@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatCardModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatDividerModule,
        TranslateModule
    ],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    private authService = inject(AuthService);
    private router = inject(Router);
    private translate = inject(TranslationService);

    currentUser = signal<FirebaseUser | null>(null);

    stats = [
        {
            icon: 'shopping_bag',
            label: 'dashboard.stats.products',
            value: '24',
            color: '#667eea',
            trend: '+12%'
        },
        {
            icon: 'receipt_long',
            label: 'dashboard.stats.orders',
            value: '156',
            color: '#764ba2',
            trend: '+8%'
        },
        {
            icon: 'attach_money',
            label: 'dashboard.stats.revenue',
            value: '$12,450',
            color: '#f093fb',
            trend: '+23%'
        },
        {
            icon: 'people',
            label: 'dashboard.stats.users',
            value: '1,234',
            color: '#4facfe',
            trend: '+15%'
        }
    ];

    recentActivities = [
        {
            icon: 'shopping_cart',
            title: 'New order received',
            description: 'Order #12345 from John Doe',
            time: '2 minutes ago',
            color: '#667eea'
        },
        {
            icon: 'person_add',
            title: 'New user registered',
            description: 'Jane Smith joined the platform',
            time: '15 minutes ago',
            color: '#4facfe'
        },
        {
            icon: 'inventory',
            title: 'Product updated',
            description: 'VR Headset Pro specifications updated',
            time: '1 hour ago',
            color: '#764ba2'
        },
        {
            icon: 'star',
            title: 'New review',
            description: '5-star review on AR Glasses',
            time: '2 hours ago',
            color: '#f093fb'
        }
    ];

    quickActions = [
        {
            icon: 'add_circle',
            label: 'Add Product',
            route: '/products/new',
            color: '#667eea'
        },
        {
            icon: 'group_add',
            label: 'Invite User',
            route: '/users/invite',
            color: '#4facfe'
        },
        {
            icon: 'analytics',
            label: 'View Analytics',
            route: '/analytics',
            color: '#764ba2'
        },
        {
            icon: 'settings',
            label: 'Settings',
            route: '/settings',
            color: '#f093fb'
        }
    ];

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            this.currentUser.set(user);
            if (!user) {
                this.router.navigate(['/auth/login']);
            }
        });
    }

    /**
     * Sign out user
     */
    async signOut() {
        await this.authService.signOut();
        this.router.navigate(['/landing']);
    }

    /**
     * Change language
     */
    changeLanguage(lang: string) {
        this.translate.use(lang);
    }

    /**
     * Navigate to quick action
     */
    navigateToAction(route: string) {
        // TODO: Navigate when routes are created
        console.log('Navigate to:', route);
    }
}
