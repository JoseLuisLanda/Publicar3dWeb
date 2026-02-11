import { Component, signal, inject, ViewChild, ElementRef, OnDestroy, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { MarkerGeneratorComponent } from './components/marker-generator/marker-generator.component';

interface ARPattern {
    id: string;
    name: string;
    imageUrl: string;
    patternUrl?: string;
    type: 'preset' | 'custom' | 'barcode';
    preset?: 'hiro' | 'kanji';
    barcodeValue?: number;
}

interface AR3DModel {
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    modelUrl: string;
    fileSize: string;
    format: 'gltf' | 'glb' | 'obj';
    scale: number;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
}

@Component({
    selector: 'app-ar-experiences',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        TranslateModule,
        MarkerGeneratorComponent
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA], // For A-Frame custom elements
    templateUrl: './ar-experiences.component.html',
    styleUrls: ['./ar-experiences.component.scss']
})
export class ArExperiencesComponent implements OnDestroy {
    private router = inject(Router);

    @ViewChild('arViewer', { static: false }) arViewerRef!: ElementRef;

    // State signals
    selectedMode = signal<'marker' | 'location' | 'image'>('marker');
    arActive = signal<boolean>(false);
    markerDetected = signal<boolean>(false);
    loading = signal<boolean>(false);
    gpsAccuracy = signal<number>(0);
    selected3DModel = signal<string>('box');
    showMarkerGenerator = signal<boolean>(false);
    zoomLevel = signal<number>(1);
    hasZoomSupport = signal<boolean>(false);
    minZoom = signal<number>(0.5); // allow zoom-out via CSS fallback
    maxZoom = signal<number>(2.5);
    private cssZoomValue = 1; // track CSS fallback scale

    // AR Scene reference
    private arScene: any = null;
    private camera: any = null;

    // Available patterns
    availablePatterns: ARPattern[] = [
        {
            id: 'hiro',
            name: 'Hiro Marker',
            imageUrl: '/assets/ar/patterns/hiro.png',
            type: 'preset',
            preset: 'hiro'
        },
        {
            id: 'kanji',
            name: 'Kanji Marker',
            imageUrl: '/assets/ar/patterns/kanji.png',
            type: 'preset',
            preset: 'kanji'
        },
        {
            id: 'custom1',
            name: 'Custom Pattern 1',
            imageUrl: '/assets/ar/patterns/custom1.png',
            type: 'custom',
            patternUrl: '/assets/ar/patterns/pattern-custom1.patt'
        }
    ];

    // Available 3D Models
    available3DModels: AR3DModel[] = [
        {
            id: 'box',
            name: '3D Box',
            description: 'Simple colored box with animation',
            thumbnailUrl: '/assets/ar/models/thumbnails/box.png',
            modelUrl: '',
            fileSize: '< 1KB',
            format: 'gltf',
            scale: 1,
            position: { x: 0, y: 0.5, z: 0 },
            rotation: { x: 0, y: 45, z: 0 }
        },
        {
            id: 'sphere',
            name: '3D Sphere',
            description: 'Animated sphere with metallic material',
            thumbnailUrl: '/assets/ar/models/thumbnails/sphere.png',
            modelUrl: '',
            fileSize: '< 1KB',
            format: 'gltf',
            scale: 0.5,
            position: { x: 0, y: 0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        {
            id: 'model3d',
            name: 'Custom 3D Model',
            description: 'Upload your own GLTF/GLB model',
            thumbnailUrl: '/assets/ar/models/thumbnails/custom.png',
            modelUrl: '',
            fileSize: 'Variable',
            format: 'glb',
            scale: 1,
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        }
    ];

    selectedPattern: ARPattern = this.availablePatterns[0];

    ngOnDestroy(): void {
        this.stopAr();
    }

    goBack(): void {
        this.router.navigate(['/home']);
    }

    selectMode(mode: 'marker' | 'location' | 'image'): void {
        this.selectedMode.set(mode);
    }

    selectPattern(pattern: ARPattern): void {
        this.selectedPattern = pattern;
    }

    select3DModel(model: AR3DModel): void {
        this.selected3DModel.set(model.id);
    }

    toggleCamera(): void {
        if (this.arActive()) {
            this.stopAr();
        } else {
            this.startAr();
        }
    }

    startAr(): void {
        this.loading.set(true);
        // Add class to body to make it transparent
        document.body.classList.add('ar-active');
        document.documentElement.classList.add('ar-active');

        // Load AR.js scripts dynamically
        this.loadARScripts().then(() => {
            // Activate AR state first to render the container
            this.arActive.set(true);
            
            // Wait for DOM update then initialize scene
            setTimeout(() => {
                this.initializeARScene();
                this.loading.set(false);
            }, 100);
        }).catch(error => {
            console.error('Error loading AR.js:', error);
            this.loading.set(false);
        });
    }

    stopAr(): void {
        // Remove class from body
        document.body.classList.remove('ar-active');
        document.documentElement.classList.remove('ar-active');

        // Reset zoom
        this.zoomLevel.set(1);
        this.hasZoomSupport.set(false);

        if (this.arScene) {
            // Clean up A-Frame scene
            const sceneEl = document.querySelector('a-scene');
            if (sceneEl) {
                sceneEl.remove();
            }
            this.arScene = null;
            this.camera = null;
        }
        this.arActive.set(false);
        this.markerDetected.set(false);
    }

    private loadARScripts(): Promise<void> {
        return new Promise((resolve, reject) => {
            // Check if already loaded
            if ((window as any).AFRAME && (window as any).AFRAME.components['arjs']) {
                resolve();
                return;
            }

            // Load A-Frame
            const aframeScript = document.createElement('script');
            aframeScript.src = 'https://cdn.jsdelivr.net/gh/aframevr/aframe@1c2407b26c61958baa93967b5412487cd94b290b/dist/aframe-master.min.js';
            aframeScript.onload = () => {
                // Load AR.js after A-Frame
                const arjsScript = document.createElement('script');
                arjsScript.src = 'https://raw.githack.com/AR-js-org/AR.js/master/aframe/build/aframe-ar.js';
                arjsScript.onload = () => resolve();
                arjsScript.onerror = () => reject(new Error('Failed to load AR.js'));
                document.head.appendChild(arjsScript);
            };
            aframeScript.onerror = () => reject(new Error('Failed to load A-Frame'));
            document.head.appendChild(aframeScript);
        });
    }

    private initializeARScene(): void {
        const viewer = this.arViewerRef?.nativeElement;
        if (!viewer) return;

        const mode = this.selectedMode();

        if (mode === 'marker') {
            this.initializeMarkerBasedAR(viewer);
        } else if (mode === 'location') {
            this.initializeLocationBasedAR(viewer);
        } else if (mode === 'image') {
            this.initializeImageTrackingAR(viewer);
        }
    }

    private initializeMarkerBasedAR(container: HTMLElement): void {
        // Create A-Frame scene
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        
        // Dynamic configuration based on device
        scene.setAttribute(
            'arjs',
            // Let AR.js choose camera defaults to avoid browser-enforced crop/resize
            `sourceType: webcam; debugUIEnabled: false; detectionMode: mono_and_matrix; matrixCodeType: 3x3; facingMode: environment;`
        );
        
        scene.setAttribute('renderer', 'logarithmicDepthBuffer: true;'); // Better depth rendering
        scene.setAttribute('vr-mode-ui', 'enabled: false'); // Disable patterns VR button

        // Initialize Zoom Capabilities once the underlying video is ready
        this.observeVideoForZoom();

        // Create marker
        const marker = document.createElement('a-marker');
        if (this.selectedPattern.type === 'preset') {
            marker.setAttribute('preset', this.selectedPattern.preset || 'hiro');
        } else if (this.selectedPattern.type === 'custom' && this.selectedPattern.patternUrl) {
            marker.setAttribute('type', 'pattern');
            marker.setAttribute('url', this.selectedPattern.patternUrl);
        }

        // Add marker events
        marker.addEventListener('markerFound', () => {
            this.markerDetected.set(true);
            console.log('Marker found!');
        });

        marker.addEventListener('markerLost', () => {
            this.markerDetected.set(false);
            console.log('Marker lost!');
        });

        // Add 3D content based on selected model
        const selectedModel = this.available3DModels.find(m => m.id === this.selected3DModel());
        if (selectedModel) {
            this.add3DModelToMarker(marker, selectedModel);
        }

        scene.appendChild(marker);

        // Create camera
        const cameraEntity = document.createElement('a-entity');
        cameraEntity.setAttribute('camera', '');
        scene.appendChild(cameraEntity);

        // Append to container
        container.innerHTML = '';
        container.appendChild(scene);

        this.arScene = scene;
        this.camera = cameraEntity;
    }

    private add3DModelToMarker(marker: HTMLElement, model: AR3DModel): void {
        if (model.id === 'box') {
            // Add animated box
            const box = document.createElement('a-box');
            box.setAttribute('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
            box.setAttribute('material', 'color: #00d9ff; opacity: 0.8; metalness: 0.5;');
            box.setAttribute('scale', `${model.scale} ${model.scale} ${model.scale}`);
            box.setAttribute('animation', 'property: rotation; to: 0 360 0; dur: 3000; easing: linear; loop: true');
            marker.appendChild(box);

            // Add torus knot
            const torus = document.createElement('a-torus-knot');
            torus.setAttribute('position', '0 0.5 0');
            torus.setAttribute('radius', '0.3');
            torus.setAttribute('radius-tubular', '0.05');
            torus.setAttribute('material', 'color: #0066ff; metalness: 0.8;');
            torus.setAttribute('animation', 'property: rotation; to: 360 0 0; dur: 5000; easing: linear; loop: true');
            marker.appendChild(torus);
        } else if (model.id === 'sphere') {
            // Add metallic sphere
            const sphere = document.createElement('a-sphere');
            sphere.setAttribute('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
            sphere.setAttribute('radius', `${model.scale}`);
            sphere.setAttribute('material', 'color: #00ff88; metalness: 0.9; roughness: 0.1;');
            sphere.setAttribute('animation', 'property: position; to: 0 1 0; dur: 2000; dir: alternate; easing: easeInOutQuad; loop: true');
            marker.appendChild(sphere);
        } else if (model.modelUrl) {
            // Add GLTF model
            const modelEntity = document.createElement('a-entity');
            modelEntity.setAttribute('gltf-model', model.modelUrl);
            modelEntity.setAttribute('position', `${model.position.x} ${model.position.y} ${model.position.z}`);
            modelEntity.setAttribute('rotation', `${model.rotation.x} ${model.rotation.y} ${model.rotation.z}`);
            modelEntity.setAttribute('scale', `${model.scale} ${model.scale} ${model.scale}`);
            marker.appendChild(modelEntity);
        }

        // Add lighting
        const light = document.createElement('a-light');
        light.setAttribute('type', 'ambient');
        light.setAttribute('intensity', '0.8');
        marker.appendChild(light);

        const directionalLight = document.createElement('a-light');
        directionalLight.setAttribute('type', 'directional');
        directionalLight.setAttribute('position', '0 1 0');
        directionalLight.setAttribute('intensity', '0.5');
        marker.appendChild(directionalLight);
    }

    private initializeLocationBasedAR(container: HTMLElement): void {
        // Create A-Frame scene for location-based AR
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType: webcam; videoTexture: true; debugUIEnabled: false;');
        scene.setAttribute('vr-mode-ui', 'enabled: false');

        // Create GPS camera
        const camera = document.createElement('a-camera');
        camera.setAttribute('gps-camera', 'gpsMinDistance:5;');
        camera.setAttribute('rotation-reader', '');
        scene.appendChild(camera);

        // Add GPS-based entities (example: place 3D objects at specific coordinates)
        // Note: Replace with actual coordinates
        const place1 = document.createElement('a-box');
        place1.setAttribute('material', 'color: red');
        place1.setAttribute('gps-entity-place', 'latitude: 37.7749; longitude: -122.4194'); // San Francisco coords as example
        place1.setAttribute('scale', '5 5 5');
        scene.appendChild(place1);

        container.innerHTML = '';
        container.appendChild(scene);

        this.arScene = scene;
        this.camera = camera;

        // Monitor GPS accuracy
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(
                (position) => {
                    this.gpsAccuracy.set(position.coords.accuracy);
                },
                (error) => console.error('GPS error:', error),
                { enableHighAccuracy: true, maximumAge: 0 }
            );
        }
    }

    private initializeImageTrackingAR(container: HTMLElement): void {
        // Image tracking implementation
        const scene = document.createElement('a-scene');
        scene.setAttribute('embedded', '');
        scene.setAttribute('arjs', 'sourceType: webcam; trackingMethod: best;');

        // Note: AR.js-org version supports image tracking
        // This would require the newer AR.js organization version
        const marker = document.createElement('a-nft');
        marker.setAttribute('type', 'nft');
        marker.setAttribute('url', '/assets/ar/targets/target-image'); // NFT descriptor files

        const selectedModel = this.available3DModels.find(m => m.id === this.selected3DModel());
        if (selectedModel) {
            this.add3DModelToMarker(marker, selectedModel);
        }

        scene.appendChild(marker);

        const cameraEntity = document.createElement('a-entity');
        cameraEntity.setAttribute('camera', '');
        scene.appendChild(cameraEntity);

        container.innerHTML = '';
        container.appendChild(scene);

        this.arScene = scene;
    }

    captureScreenshot(): void {
        if (!this.arScene) return;

        const canvas = this.arScene.querySelector('canvas');
        if (canvas) {
            const dataURL = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `ar-screenshot-${Date.now()}.png`;
            link.href = dataURL;
            link.click();
        }
    }

    toggleDebug(): void {
        if (!this.arScene) return;

        const currentDebug = this.arScene.getAttribute('arjs').includes('debugUIEnabled: true');
        const arjsAttr = this.arScene.getAttribute('arjs').replace(
            /debugUIEnabled: (true|false)/,
            `debugUIEnabled: ${!currentDebug}`
        );
        this.arScene.setAttribute('arjs', arjsAttr);
    }

    switchModel(): void {
        const currentIndex = this.available3DModels.findIndex(m => m.id === this.selected3DModel());
        const nextIndex = (currentIndex + 1) % this.available3DModels.length;
        this.selected3DModel.set(this.available3DModels[nextIndex].id);

        // Restart AR with new model
        if (this.arActive()) {
            this.stopAr();
            setTimeout(() => this.startAr(), 500);
        }
    }

    private observeVideoForZoom(): void {
        const findVideo = (): HTMLVideoElement | null => {
            // AR.js usually injects #arjs-video; fall back to the first video tag
            const specific = document.querySelector('video#arjs-video') as HTMLVideoElement | null;
            return specific || (document.querySelector('video') as HTMLVideoElement | null);
        };

        const tryOnce = () => {
            const video = findVideo();
            if (video && video.srcObject) {
                this.checkZoomCapabilities(video);
                return true;
            }
            return false;
        };

        // Try immediately
        if (tryOnce()) return;

        // Observe DOM until video appears
        const observer = new MutationObserver(() => {
            if (tryOnce()) {
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    private checkZoomCapabilities(video: HTMLVideoElement): void {
        console.log('Checking zoom capabilities...');
        const stream = video.srcObject as MediaStream | null;
        if (!stream) return;

        const tracks = stream.getVideoTracks();
        if (!tracks.length) return;

        const track = tracks[0] as any;
        const capabilities = track.getCapabilities ? track.getCapabilities() : {};
        const settings = track.getSettings ? track.getSettings() : {};

        console.log('Track capabilities:', capabilities);

        if ('zoom' in capabilities) {
            this.hasZoomSupport.set(true);
            this.minZoom.set(capabilities.zoom.min);
            this.maxZoom.set(capabilities.zoom.max);

            const targetZoom = settings.zoom ?? capabilities.zoom.min ?? 1;
            this.zoomLevel.set(targetZoom);

            // Actively set zoom to the minimum/default to avoid device default zoom
            if (track.applyConstraints) {
                track.applyConstraints({ advanced: [{ zoom: targetZoom }] })
                    .then(() => console.log('Initial zoom set to', targetZoom))
                    .catch((err: any) => console.warn('Unable to set initial zoom', err));
            }
            console.log('Zoom supported:', capabilities.zoom);
        } else {
            console.warn('Zoom not supported by this camera/browser');
            this.hasZoomSupport.set(false);
            // Software fallback: start at 1 (sin zoom inicial)
            const fallbackZoom = 1;
            this.minZoom.set(0.5);
            this.maxZoom.set(2);
            this.zoomLevel.set(fallbackZoom);
            this.applyCssZoomFallback(fallbackZoom);
        }
    }

    setZoom(event: any): void {
        const value = parseFloat(event.target.value);
        this.zoomLevel.set(value);
        
        const video = document.querySelector('video') as HTMLVideoElement | null;
        if (this.hasZoomSupport()) {
            const video = document.querySelector('video') as HTMLVideoElement | null;
            if (video && video.srcObject) {
            const stream = video.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0] as any;
            
                if (track.applyConstraints) {
                    track.applyConstraints({
                        advanced: [{ zoom: value }]
                    }).then(() => console.log('Zoom set to', value))
                      .catch((err: any) => console.error('Error setting zoom:', err));
                }
            }
            return;
        }

        // Fallback: apply CSS scale when hardware zoom is unavailable
        this.applyCssZoomFallback(value);
    }

    private applyCssZoomFallback(value: number): void {
        this.cssZoomValue = value;
        const viewer = this.arViewerRef?.nativeElement as HTMLElement | null;
        if (viewer) {
            viewer.style.setProperty('--ar-video-scale', `${value}`);
            viewer.style.setProperty('--ar-canvas-scale', `${value}`);
        }
        // Also propagate globally for AR.js-injected nodes outside the viewer
        const root = document.documentElement;
        root.style.setProperty('--ar-video-scale', `${value}`);
        root.style.setProperty('--ar-canvas-scale', `${value}`);
    }

    generateCustomMarker(): void {
        this.showMarkerGenerator.set(true);
    }

    closeMarkerGenerator(event?: Event): void {
        if (event) {
            // Check if click was on overlay (outside modal content)
            const target = event.target as HTMLElement;
            if (target.classList.contains('modal-overlay')) {
                this.showMarkerGenerator.set(false);
            }
        } else {
            // Direct close call (e.g. from close button)
            this.showMarkerGenerator.set(false);
        }
    }
}
