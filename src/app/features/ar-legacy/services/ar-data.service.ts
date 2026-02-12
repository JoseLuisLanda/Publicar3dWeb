import { Injectable, signal } from '@angular/core';
import { ArElement } from '../../ar-info/models/ar-element.model';

/**
 * Service to share AR element data between components
 * Used for passing data from AR-Info to AR Pattern Viewer
 */
@Injectable({
    providedIn: 'root'
})
export class ArDataService {
    // Signal to hold the selected AR element
    private selectedElementSignal = signal<ArElement | null>(null);
    
    /**
     * Set the selected AR element
     */
    setSelectedElement(element: ArElement): void {
        console.log('📦 ArDataService - Setting element:', element);
        this.selectedElementSignal.set(element);
    }
    
    /**
     * Get the selected AR element
     */
    getSelectedElement(): ArElement | null {
        return this.selectedElementSignal();
    }
    
    /**
     * Clear the selected element
     */
    clearSelectedElement(): void {
        this.selectedElementSignal.set(null);
    }
}
