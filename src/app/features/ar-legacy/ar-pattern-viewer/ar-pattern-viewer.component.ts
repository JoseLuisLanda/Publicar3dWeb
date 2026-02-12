import { Component, OnInit, OnDestroy, ElementRef, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ArDataService } from '../services/ar-data.service';
import { ArElement } from '../../ar-info/models/ar-element.model';

/**
 * AR Pattern Viewer Component
 * Displays AR content (images, videos, 3D models) when patterns are detected
 * Based on legacy afelement component
 */
@Component({
    selector: 'app-ar-pattern-viewer',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
    templateUrl: './ar-pattern-viewer.component.html',
    styleUrls: ['./ar-pattern-viewer.component.scss']
})
export class ArPatternViewerComponent implements OnInit, OnDestroy {
    private elementRef = inject(ElementRef);
    private router = inject(Router);
    private arDataService = inject(ArDataService);

    item: ArElement | null = null;
    tagNumberInit = 0;
    tagNumberEnd = 1;
    tagNumberLength = 1;
    currentMarkerIndex = 0;

    ngOnInit(): void {
        console.log('🎯 AR Pattern Viewer initialized');
        
        // Get element from service (set by AR-Info component)
        const state = history.state;
        if (state && state.element) {
            this.item = state.element;
        } else {
            this.item = this.arDataService.getSelectedElement();
        }

        if (!this.item || !this.item.images) {
            console.error('❌ No element data received');
            this.router.navigate(['/ar-info']);
            return;
        }

        // Save to service for later use
        this.arDataService.setSelectedElement(this.item);

        console.log('📦 Received element:', this.item);
        this.initializeARScene();
    }

    ngOnDestroy(): void {
        // Clean up
        this.arDataService.clearSelectedElement();
        document.body.classList.remove('ar-active');
        document.documentElement.classList.remove('ar-active');
    }

    /**
     * Initialize AR Scene with markers
     */
    private initializeARScene(): void {
        if (!this.item || !this.item.images) return;

        // Calculate tag numbers based on images
        this.tagNumberLength = this.item.images.length - 1;
        this.tagNumberInit = this.item.indexInit || 0;
        this.tagNumberEnd = this.item.indexEnd || this.tagNumberLength;

        // Add AR active class
        document.body.classList.add('ar-active');
        document.documentElement.classList.add('ar-active');

        // Add camera error listeners
        this.addCameraListeners();

        // Scripts are now loaded from index.html, just wait for scene
        console.log('✅ AR Scripts loaded from index.html');
        // Wait for A-Frame scene to be fully loaded
        setTimeout(() => {
            this.waitForSceneReady();
        }, 500);
    }

    /**
     * Add listeners for camera initialization
     */
    private addCameraListeners(): void {
        window.addEventListener('arjs-video-loaded', () => {
            console.log('✅ Camera video loaded successfully');
        });

        window.addEventListener('camera-error', (event: any) => {
            console.error('❌ Camera error:', event.detail);
        });

        window.addEventListener('camera-init', () => {
            console.log('✅ Camera initialization started');
        });
    }

    /**
     * Wait for A-Frame scene to be ready
     */
    private waitForSceneReady(): void {
        const scene = this.elementRef.nativeElement.querySelector('a-scene');
        if (!scene) {
            console.error('❌ A-Frame scene not found');
            return;
        }

        // Wait for scene to be loaded
        if (scene.hasLoaded) {
            console.log('✅ Scene already loaded, creating markers');
            setTimeout(() => this.createMarkers(), 1500);
        } else {
            console.log('⏳ Waiting for scene to load...');
            scene.addEventListener('loaded', () => {
                console.log('✅ Scene loaded event fired, creating markers');
                setTimeout(() => this.createMarkers(), 1500);
            });
        }
    }

    /**
     * Load A-Frame and AR.js scripts dynamically
     */
    private loadARScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if ((window as any).AFRAME && (window as any).AFRAME.components['arjs']) {
                console.log('✅ Scripts already loaded');
                resolve();
                return;
            }

            console.log('📦 Loading A-Frame script...');
            const aframeScript = document.createElement('script');
            // Use same version as legacy (0.9.2)
            aframeScript.src = 'https://aframe.io/releases/0.9.2/aframe.min.js';
            aframeScript.onload = () => {
                console.log('✅ A-Frame loaded, loading AR.js...');
                const arjsScript = document.createElement('script');
                // Use same version as legacy (2.0.8)
                arjsScript.src = 'https://raw.githack.com/jeromeetienne/AR.js/2.0.8/aframe/build/aframe-ar.js';
                arjsScript.onload = () => {
                    console.log('✅ AR.js loaded, loading gesture detector...');
                    // Load gesture detector
                    this.loadGestureDetector().then(resolve).catch(reject);
                };
                arjsScript.onerror = () => {
                    console.error('❌ Failed to load AR.js');
                    reject(new Error('Failed to load AR.js'));
                };
                document.head.appendChild(arjsScript);
            };
            aframeScript.onerror = () => {
                console.error('❌ Failed to load A-Frame');
                reject(new Error('Failed to load A-Frame'));
            };
            document.head.appendChild(aframeScript);
        });
    }

    /**
     * Load gesture detector for pinch-to-zoom on AR objects
     */
    private loadGestureDetector(): Promise<void> {
        return new Promise((resolve) => {
            // Add a small delay after AR.js loads before loading gesture detector
            setTimeout(() => {
                const gestureScript = document.createElement('script');
                gestureScript.src = '/assets/js/gesture-detector.js';
                gestureScript.onload = () => {
                    console.log('✅ Gesture detector loaded');
                    resolve();
                };
                gestureScript.onerror = () => {
                    console.warn('⚠️ Gesture detector not loaded');
                    resolve(); // Continue anyway
                };
                document.head.appendChild(gestureScript);
            }, 500);
        });
    }

    /**
     * Create AR markers dynamically based on item images
     */
    private createMarkers(): void {
        if (!this.item || !this.item.images) return;

        const scene = this.elementRef.nativeElement.querySelector('.scene');
        if (!scene) {
            console.error('❌ A-Frame scene not found');
            return;
        }

        // Create markers for each image
        for (let i = 0; i <= this.tagNumberLength; i++) {
            const indexPath = this.tagNumberInit + i;
            const patternUrl = `/assets/presets/pat${indexPath}.patt`;
            const markerId = `marker_${i}`;

            // Create marker element
            const markerHTML = `<a-marker id="${markerId}" type="pattern" registerevents url="${patternUrl}"></a-marker>`;
            scene.insertAdjacentHTML('beforeend', markerHTML);

            const marker = this.elementRef.nativeElement.querySelector(`#${markerId}`);
            if (!marker) continue;

            const image = this.item.images[i];
            if (!image) continue;

            // Add content based on type
            if (image.type === 'video') {
                this.addVideoToMarker(marker, indexPath);
            } else if (image.type === 'model') {
                this.addModelToMarker(marker, indexPath, image.value || '');
            } else {
                // Default: image/poster/vcard
                this.addImageToMarker(marker, i, image.type || 'image');
            }
        }

        console.log('✅ Markers created successfully');
    }

    /**
     * Add video content to marker
     */
    private addVideoToMarker(marker: any, index: number): void {
        marker.insertAdjacentHTML('beforeEnd',
            `<a-video class="clickable" gesture-handler="minScale: 0.25; maxScale: 10" 
             id="videop${index}" src="#video${index}" 
             position="0 0 0" rotation="270 0 0"></a-video>`
        );
    }

    /**
     * Add 3D model content to marker
     */
    private addModelToMarker(marker: any, index: number, modelUrl: string): void {
        marker.insertAdjacentHTML('beforeEnd',
            `<a-asset-item id="model${index}" response-type="arraybuffer" 
             position="0 .1 0" rotation="0, 0, 0" src="${modelUrl}"></a-asset-item>`
        );
        marker.insertAdjacentHTML('beforeEnd',
            `<a-gltf-model class="clickable" gesture-handler="minScale: 0.25; maxScale: 10" 
             position="0 .1 0" rotation="-90, 0, 0" src="#model${index}"></a-gltf-model>`
        );
    }

    /**
     * Add image content to marker
     */
    private addImageToMarker(marker: any, index: number, type: string): void {
        const width = type === 'poster' ? 2 : 3;
        const height = type === 'vcard' ? 2 : 3;

        marker.insertAdjacentHTML('beforeEnd',
            `<a-image class="clickable" gesture-handler="minScale: 0.25; maxScale: 10" 
             position="0 1 0" rotation="-90, 0, 0" 
             src="#img${index}" width="${width}" height="${height}"></a-image>`
        );
    }

    /**
     * Go back to home
     */
    goToHome(): void {
        this.router.navigate(['/ar-info']);
    }
}
