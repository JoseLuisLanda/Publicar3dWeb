import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Subject, Subscription } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ArElementsService } from './services/ar-elements.service';
import { ArElement } from './models/ar-element.model';
import { AuthService } from '../../core/services/auth.service';
import { ArDataService } from '../ar-legacy/services/ar-data.service';

@Component({
    selector: 'app-ar-info',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterModule,
        MatIconModule,
        MatCardModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        TranslateModule
    ],
    templateUrl: './ar-info.component.html',
    styleUrls: ['./ar-info.component.scss']
})
export class ArInfoComponent implements OnInit, OnDestroy {
    private arElementsService = inject(ArElementsService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private translate = inject(TranslateService);
    private arDataService = inject(ArDataService);
    private destroy$ = new Subject<void>();

    searchElements = signal<ArElement[]>([]);
    lugares = signal<ArElement[]>([
        { uid: '1', name: 'Lugares', code: 'general', normalizedName: 'lugares' },
        { uid: '2', name: 'Negocio', code: 'negocio', normalizedName: 'negocio' }
    ]);
    loading = signal<boolean>(true); // Start with loading true
    selectedPlace = signal<string>('negocio');
    private _searchFilter = signal<string>('');
    folder = signal<string>('negocio');
    code = signal<string>('negocio');
    location = signal<string>('negocio');
    emailConfirmed = signal<boolean>(false);
    textError = signal<string>('');

    // Getter and setter for ngModel compatibility
    get searchFilter(): string {
        return this._searchFilter();
    }
    set searchFilter(value: string) {
        this._searchFilter.set(value);
    }

    ngOnInit(): void {
        console.log('🚀 AR-Info Component initialized');
        
        // Check if user is authenticated
        this.authService.currentUser$
            .pipe(takeUntil(this.destroy$))
            .subscribe(user => {
                this.emailConfirmed.set(!!user);
                console.log('👤 User authenticated:', !!user);
            });

        // Get query parameters
        this.route.queryParams
            .pipe(takeUntil(this.destroy$))
            .subscribe(params => {
                console.log('📋 Query params:', params);
                
                if (params['place']) {
                    this.location.set(params['place']);
                    // Load from specific collection without array-contains filter
                    this.arElementsService.getCollection('lugares', 100, '', '', '', '')
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (data) => {
                                console.log('📦 Initial load:', data.length);
                                this.searchElements.set(data);
                                this.loading.set(false);
                            },
                            error: (error) => {
                                console.error('❌ Error initial load:', error);
                                this.loading.set(false);
                            }
                        });
                }

                if (params['type'] && params['code']) {
                    this.arElementsService.getCollection(params['type'], 100, '', '', '', '')
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (data) => {
                                console.log('📦 Load by type:', data.length);
                                this.searchElements.set(data);
                                this.loading.set(false);
                            },
                            error: (error) => {
                                console.error('❌ Error loading by type:', error);
                                this.loading.set(false);
                            }
                        });
                } else if (!params['place']) {
                    // Default: load from negocio collection
                    console.log('📍 Loading default from negocio');
                    this.arElementsService.getCollection('negocio', 100, '', '', '', '')
                        .pipe(takeUntil(this.destroy$))
                        .subscribe({
                            next: (data) => {
                                console.log('📦 Default load from negocio:', data.length);
                                this.searchElements.set(data);
                                this.loading.set(false);
                            },
                            error: (error) => {
                                console.error('❌ Error default load:', error);
                                this.loading.set(false);
                            }
                        });
                }
            });

        // Load lugares for dropdown
        this.loadLugares();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    /**
     * Load lugares (places) for selection
     */
    private loadLugares(): void {
        // Keep default places and optionally load from Firebase
        this.arElementsService.getLugares('general')
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    if (data && data.length > 0) {
                        const sortedData = data
                            .sort((a, b) => (a.indexInit || 0) - (b.indexInit || 0))
                            .filter(obj => obj.normalizedName !== 'general');
                        
                        // Merge with default places
                        const defaultPlaces: ArElement[] = [
                            { uid: '1', name: 'Lugares', code: 'general', normalizedName: 'lugares' },
                            { uid: '2', name: 'Negocio', code: 'negocio', normalizedName: 'negocio' }
                        ];
                        
                        // Add Firebase data if not already in defaults
                        const mergedPlaces: ArElement[] = [...defaultPlaces];
                        sortedData.forEach(place => {
                            if (!mergedPlaces.find(p => p.normalizedName === place.normalizedName)) {
                                mergedPlaces.push(place);
                            }
                        });
                        
                        this.lugares.set(mergedPlaces);
                    }
                },
                error: (error) => {
                    console.error('Error loading lugares:', error);
                    // Keep default places even on error
                }
            });
    }

    /**
     * Get elements from Firebase
     */
    private getElements(collectionName: string, codeValue: string): void {
        console.log('🔎 Component - getElements:', { collectionName, codeValue });
        
        this.loading.set(true);
        this.textError.set('');

        this.arElementsService.getCollection(collectionName, 50, '', '', 'codes', codeValue)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    console.log('📦 Component - Received data:', data);
                    if (data && data.length > 0) {
                        const sortedData = data.sort((a, b) => (a.indexInit || 0) - (b.indexInit || 0));
                        this.searchElements.set(sortedData);
                        this.folder.set(collectionName);
                        this.code.set(codeValue);
                        console.log('✅ Search elements updated:', sortedData.length);
                    } else {
                        this.searchElements.set([]);
                        this.textError.set(`No se encontraron elementos en la colección "${collectionName}" con código "${codeValue}"`);
                        console.log('⚠️ No data found');
                    }
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('❌ Component - Error loading elements:', error);
                    this.textError.set(`Error al cargar elementos de "${collectionName}": ${error.message}`);
                    this.loading.set(false);
                }
            });
    }

    /**
     * Handle place selection change
     */
    onSelectChange(value: string): void {
        console.log('🏷️ Place changed:', value);
        if (value) {
            this.selectedPlace.set(value);
            this.location.set(value === 'lugares' ? 'general' : value);
            this.folder.set(value);
            this._searchFilter.set(''); // Clear search filter
            
            // Load all elements from this collection without code filter
            this.loading.set(true);
            this.textError.set('');
            
            const displayName = value === 'lugares' ? 'Lugares' : 'Negocio';
            
            // Get all elements from the collection (no array-contains filter)
            this.arElementsService.getCollection(value, 100, '', '', '', '')
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                    next: (data) => {
                        console.log('📦 Elements from', value, ':', data.length);
                        if (data && data.length > 0) {
                            const sortedData = data.sort((a, b) => (a.indexInit || 0) - (b.indexInit || 0));
                            this.searchElements.set(sortedData);
                        } else {
                            this.searchElements.set([]);
                            this.textError.set(`No hay elementos en "${displayName}"`);
                        }
                        this.loading.set(false);
                    },
                    error: (error) => {
                        console.error('❌ Error loading collection:', error);
                        this.textError.set(`Error al cargar "${displayName}": ${error.message}`);
                        this.loading.set(false);
                    }
                });
        }
    }

    /**
     * Clear search and reload all elements
     */
    clearSearch(): void {
        console.log('🧹 Clearing search');
        this._searchFilter.set('');
        const currentPlace = this.selectedPlace();
        if (currentPlace) {
            this.onSelectChange(currentPlace);
        }
    }

    /**
     * Search by keyword
     */
    buscarProd(): void {
        const filter = this._searchFilter();
        console.log('🔍 Search by keyword:', filter, 'in folder:', this.folder());
        
        // Si no hay filtro, cargar todos los elementos del lugar seleccionado
        if (!filter || filter.trim() === '') {
            console.log('📍 No filter, loading all elements from:', this.folder(), this.code());
            this.getElements(this.folder(), this.code());
            return;
        }

        this.loading.set(true);
        this.textError.set('');

        this.arElementsService.searchByKeyword(this.folder(), filter)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => {
                    console.log('📦 Search results:', data.length);
                    this.searchElements.set(data);
                    if (data.length === 0) {
                        this.textError.set(`No se encontraron resultados para "${filter}" en "${this.folder()}"`);
                    }
                    this.loading.set(false);
                },
                error: (error) => {
                    console.error('❌ Error searching:', error);
                    this.textError.set(`Error en la búsqueda: ${error.message}`);
                    this.loading.set(false);
                }
            });
    }

    /**
     * Show item details
     */
    showItem(element: ArElement, image: ArElement): void {
        console.log('Show item:', element, image);
        // Implement modal or detail view
    }

    /**
     * Navigate to 3D view
     */
    switchTo3D(element: ArElement): void {
        console.log('🚀 Switch to 3D AR:', element);
        // Navigate to AR experiences with element data for 3D model viewing
        this.router.navigate(['/ar-experiences'], {
            state: {
                element: element,
                mode: '3d',
                type: 'model'
            }
        });
    }

    /**
     * Navigate to QR view
     */
    switchToPlace(element: ArElement): void {
        console.log('📸 Switch to QR/Pattern AR:', element);
        
        // Set element in service for AR Pattern Viewer
        this.arDataService.setSelectedElement(element);
        
        // Navigate to AR Pattern Viewer (similar to legacy qrelement)
        this.router.navigate(['/ar-pattern-viewer'], {
            state: {
                element: element,
                mode: 'marker',
                type: 'photos'
            }
        });
    }

    /**
     * Go back to home
     */
    goBack(): void {
        this.router.navigate(['/home']);
    }

    /**
     * Switch language
     */
    switchLanguage(lang: string): void {
        this.translate.use(lang);
    }

    currentLang(): string {
        return this.translate.currentLang || this.translate.defaultLang || 'en';
    }
}
