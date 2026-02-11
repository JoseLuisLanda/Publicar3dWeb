import { Injectable } from '@angular/core';

/**
 * AR Pattern Generator Service
 * Translated from THREEx.ArPatternFile.js to Angular TypeScript
 * Generates AR.js pattern files and marker images
 */
@Injectable({
    providedIn: 'root'
})
export class ArPatternGeneratorService {

    /**
     * Encode an image URL to AR.js pattern file format
     */
    encodeImageURL(imageURL: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => {
                try {
                    const patternFileString = this.encodeImage(image);
                    resolve(patternFileString);
                } catch (error) {
                    reject(error);
                }
            };
            image.onerror = () => reject(new Error('Failed to load image'));
            image.src = imageURL;
        });
    }

    /**
     * Encode an image element to AR.js pattern file format
     */
    private encodeImage(image: HTMLImageElement): string {
        // Create canvas for processing
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Cannot get 2D context');

        canvas.width = 16;
        canvas.height = 16;

        let patternFileString = '';

        // Generate pattern for 4 orientations (0°, 90°, 180°, 270°)
        for (let orientation = 0; orientation > -2 * Math.PI; orientation -= Math.PI / 2) {
            // Draw image with current orientation
            context.save();
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.translate(canvas.width / 2, canvas.height / 2);
            context.rotate(orientation);
            context.drawImage(image, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            context.restore();

            // Get image data
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

            // Add newline between orientations (except first)
            if (orientation !== 0) patternFileString += '\n';

            // Generate pattern file string for this orientation
            // NOTE: BGR order (not RGB!) - channels 2, 1, 0
            for (let channelOffset = 2; channelOffset >= 0; channelOffset--) {
                for (let y = 0; y < imageData.height; y++) {
                    for (let x = 0; x < imageData.width; x++) {
                        if (x !== 0) patternFileString += ' ';

                        const offset = (y * imageData.width * 4) + (x * 4) + channelOffset;
                        const value = imageData.data[offset];

                        patternFileString += String(value).padStart(3, ' ');
                    }
                    patternFileString += '\n';
                }
            }
        }

        return patternFileString;
    }

    /**
     * Trigger download of pattern file
     */
    triggerDownload(patternFileString: string, fileName: string = 'pattern-marker.patt'): void {
        const blob = new Blob([patternFileString], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);

        const domElement = document.createElement('a');
        domElement.href = url;
        domElement.download = fileName;
        document.body.appendChild(domElement);
        domElement.click();
        document.body.removeChild(domElement);

        // Clean up
        window.URL.revokeObjectURL(url);
    }

    /**
     * Build full marker image with border
     */
    buildFullMarker(
        innerImageURL: string,
        pattRatio: number,
        size: number,
        color: string
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            const whiteMargin = 0.1;
            const blackMargin = (1 - 2 * whiteMargin) * ((1 - pattRatio) / 2);
            const innerMargin = whiteMargin + blackMargin;

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            if (!context) {
                reject(new Error('Cannot get 2D context'));
                return;
            }

            canvas.width = canvas.height = size;

            // White background
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);

            // Black border
            context.fillStyle = color;
            context.fillRect(
                whiteMargin * canvas.width,
                whiteMargin * canvas.height,
                canvas.width * (1 - 2 * whiteMargin),
                canvas.height * (1 - 2 * whiteMargin)
            );

            // Clear area for inner image (white background for transparency)
            context.fillStyle = 'white';
            context.fillRect(
                innerMargin * canvas.width,
                innerMargin * canvas.height,
                canvas.width * (1 - 2 * innerMargin),
                canvas.height * (1 - 2 * innerMargin)
            );

            // Load and draw inner image
            const innerImage = document.createElement('img');
            innerImage.addEventListener('load', () => {
                context.drawImage(
                    innerImage,
                    innerMargin * canvas.width,
                    innerMargin * canvas.height,
                    canvas.width * (1 - 2 * innerMargin),
                    canvas.height * (1 - 2 * innerMargin)
                );

                const imageUrl = canvas.toDataURL('image/png');
                resolve(imageUrl);
            });
            innerImage.addEventListener('error', () => {
                reject(new Error('Failed to load inner image'));
            });
            innerImage.src = innerImageURL;
        });
    }

    /**
     * Validate color string (hex or named color)
     */
    isValidColor(color: string): boolean {
        // Check for hex color
        if (/^#[0-9A-F]{6}$/i.test(color)) {
            return true;
        }

        // Check for named color
        const s = new Option().style;
        s.color = color;
        return s.color === color || /^#[0-9A-F]{6}$/i.test(s.color);
    }

    /**
     * Download marker image
     */
    downloadMarkerImage(imageUrl: string, fileName: string = 'pattern-marker.png'): void {
        const domElement = document.createElement('a');
        domElement.href = imageUrl;
        domElement.download = fileName;
        document.body.appendChild(domElement);
        domElement.click();
        document.body.removeChild(domElement);
    }
}
