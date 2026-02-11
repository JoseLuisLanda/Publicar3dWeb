import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TranslateModule } from '@ngx-translate/core';
import { ArPatternGeneratorService } from '../../services/ar-pattern-generator.service';

interface ExampleMarker {
    name: string;
    imageUrl: string;
}

@Component({
    selector: 'app-marker-generator',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        TranslateModule
    ],
    templateUrl: './marker-generator.component.html',
    styleUrls: ['./marker-generator.component.scss']
})
export class MarkerGeneratorComponent implements OnInit {
    private patternGenerator = inject(ArPatternGeneratorService);

    // State signals
    innerImageURL = signal<string>('');
    fullMarkerURL = signal<string>('');
    patternRatio = signal<number>(0.50);
    imageSize = signal<number>(512);
    borderColor = signal<string>('#000000');
    imageName = signal<string>('marker');
    showPdfOptions = signal<boolean>(false);
    loading = signal<boolean>(false);

    // Example markers
    exampleMarkers: ExampleMarker[] = [
        {
            name: 'Publicar3D Logo',
            imageUrl: '/assets/ar/examples/publicar3d-logo.png'
        },
        {
            name: 'QR Code',
            imageUrl: '/assets/ar/examples/qr-example.png'
        },
        {
            name: 'Geometric',
            imageUrl: '/assets/ar/examples/geometric.png'
        }
    ];

    ngOnInit(): void {
        // Load default example marker
        this.loadDefaultMarker();
    }

    private loadDefaultMarker(): void {
        // Create a simple default marker with text
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = 512;
        canvas.height = 512;

        // White background
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Draw Publicar3D text
        context.fillStyle = '#00d9ff';
        context.font = 'bold 80px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('Publicar3D', canvas.width / 2, canvas.height / 2);

        // Draw AR text below
        context.font = 'bold 60px Arial';
        context.fillText('AR', canvas.width / 2, canvas.height / 2 + 80);

        const defaultImageURL = canvas.toDataURL('image/png');
        this.innerImageURL.set(defaultImageURL);
        this.updateFullMarkerImage();
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) return;

        const file = input.files[0];
        this.imageName.set(file.name.replace(/\.[^/.]+$/, '') || 'marker');

        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            if (e.target?.result) {
                this.innerImageURL.set(e.target.result as string);
                this.updateFullMarkerImage();
            }
        };
        reader.readAsDataURL(file);
    }

    onPatternRatioChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.patternRatio.set(parseFloat(value));
        this.updateFullMarkerImage();
    }

    onImageSizeChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        this.imageSize.set(parseInt(value, 10));
        this.updateFullMarkerImage();
    }

    onBorderColorChange(event: Event): void {
        const value = (event.target as HTMLInputElement).value;
        let color = value;

        // Validate color
        if (!this.patternGenerator.isValidColor(color)) {
            color = '#000000'; // Default to black if invalid
        }

        this.borderColor.set(color);
        this.updateFullMarkerImage();
    }

    private updateFullMarkerImage(): void {
        if (!this.innerImageURL()) return;

        this.loading.set(true);
        this.patternGenerator.buildFullMarker(
            this.innerImageURL(),
            this.patternRatio(),
            this.imageSize(),
            this.borderColor()
        ).then(markerUrl => {
            this.fullMarkerURL.set(markerUrl);
            this.loading.set(false);
        }).catch(error => {
            console.error('Error building marker:', error);
            this.loading.set(false);
        });
    }

    async downloadPattern(): Promise<void> {
        if (!this.innerImageURL()) {
            alert('Please upload an image first');
            return;
        }

        try {
            this.loading.set(true);
            const patternString = await this.patternGenerator.encodeImageURL(this.innerImageURL());
            const fileName = `pattern-${this.imageName()}.patt`;
            this.patternGenerator.triggerDownload(patternString, fileName);
            this.loading.set(false);
        } catch (error) {
            console.error('Error generating pattern:', error);
            alert('Error generating pattern file');
            this.loading.set(false);
        }
    }

    downloadImage(): void {
        if (!this.fullMarkerURL()) {
            alert('No marker generated yet');
            return;
        }

        const fileName = `pattern-${this.imageName()}.png`;
        this.patternGenerator.downloadMarkerImage(this.fullMarkerURL(), fileName);
    }

    downloadPDF(): void {
        this.showPdfOptions.set(!this.showPdfOptions());
    }

    generatePDF(markersPerPage: number): void {
        if (!this.fullMarkerURL()) {
            alert('No marker generated yet');
            return;
        }

        // Import pdfmake dynamically
        // @ts-ignore
        import('pdfmake/build/pdfmake').then(async pdfMakeModule => {
            const pdfMake = pdfMakeModule.default;

            // Import fonts
            // @ts-ignore
            const vfsFonts = await import('pdfmake/build/vfs_fonts');
            (pdfMake as any).vfs = vfsFonts.default.pdfMake.vfs;

            let docDefinition: any;

            if (markersPerPage === 1) {
                docDefinition = {
                    content: [{
                        image: this.fullMarkerURL(),
                        width: 500,
                        alignment: 'center'
                    }]
                };
            } else if (markersPerPage === 2) {
                docDefinition = {
                    content: [
                        {
                            image: this.fullMarkerURL(),
                            width: 250,
                            alignment: 'center'
                        },
                        {
                            image: this.fullMarkerURL(),
                            width: 250,
                            alignment: 'center',
                            margin: [0, 20, 0, 0]
                        }
                    ]
                };
            } else if (markersPerPage === 6) {
                docDefinition = {
                    content: [
                        {
                            columns: [
                                { image: this.fullMarkerURL(), width: 200 },
                                { image: this.fullMarkerURL(), width: 200 }
                            ]
                        },
                        {
                            columns: [
                                { image: this.fullMarkerURL(), width: 200 },
                                { image: this.fullMarkerURL(), width: 200 }
                            ],
                            margin: [0, 10, 0, 0]
                        },
                        {
                            columns: [
                                { image: this.fullMarkerURL(), width: 200 },
                                { image: this.fullMarkerURL(), width: 200 }
                            ],
                            margin: [0, 10, 0, 0]
                        }
                    ]
                };
            }

            pdfMake.createPdf(docDefinition).download(`${this.imageName()}-markers.pdf`);
            this.showPdfOptions.set(false);
        }).catch(error => {
            console.error('Error loading PDF library:', error);
            alert('Error generating PDF. Please try again.');
        });
    }

    loadExample(example: ExampleMarker): void {
        this.innerImageURL.set(example.imageUrl);
        this.imageName.set(example.name.toLowerCase().replace(/\s+/g, '-'));
        this.updateFullMarkerImage();
    }

    showInfo(): void {
        const message = `
      AR Marker Generator Tips:
      
      1. Upload a high-contrast image for best results
      2. Simple, bold designs work better than complex ones
      3. Avoid using similar images for different markers
      4. Pattern Ratio controls the size of your image vs the black border
      5. Download the .patt file to use with AR.js
      
      For more information, visit: https://artoolkit.org/documentation/
    `;
        alert(message);
    }
}
