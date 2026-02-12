import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    collectionData,
    query,
    where,
    orderBy,
    limit,
    QueryConstraint
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ArElement } from '../models/ar-element.model';

@Injectable({
    providedIn: 'root'
})
export class ArElementsService {
    private firestore = inject(Firestore);

    /**
     * Get collection with filters
     * @param nameCollection Collection name
     * @param count Limit of results
     * @param keySearch Key to search
     * @param keyValue Value to search
     * @param collectionField Field to filter by array
     * @param value Value to filter
     */
    getCollection(
        nameCollection: string,
        count: number = 10,
        keySearch: string = '',
        keyValue: string = '',
        collectionField: string = '',
        value: string = ''
    ): Observable<ArElement[]> {
        console.log('🔍 FirebaseService - getCollection:', {
            nameCollection,
            count,
            keySearch,
            keyValue,
            collectionField,
            value
        });

        try {
            const constraints: QueryConstraint[] = [];

            // Filter by array contains
            if (collectionField !== '' && value !== '') {
                console.log('Adding array-contains filter:', collectionField, value);
                constraints.push(where(collectionField, 'array-contains', value));
            } 
            // Filter by exact match
            else if (keySearch !== '' && keyValue !== '') {
                console.log('Adding exact match filter:', keySearch, keyValue);
                constraints.push(where(keySearch, '==', keyValue));
            } 
            // Default: limit only (avoid orderBy which might fail if field doesn't exist)
            else {
                console.log('Using default limit:', count);
                constraints.push(limit(count));
            }

            const collectionRef = collection(this.firestore, nameCollection);
            const q = query(collectionRef, ...constraints);

            return collectionData(q, { idField: 'id' }).pipe(
                map(data => {
                    console.log('✅ Firebase data received:', data.length, 'items');
                    return data as ArElement[];
                })
            );
        } catch (error) {
            console.error('❌ Error building query:', error);
            throw error;
        }
    }

    /**
     * Search by keywords
     * @param nameCollection Collection name
     * @param searchText Text to search
     */
    searchByKeyword(
        nameCollection: string,
        searchText: string
    ): Observable<ArElement[]> {
        console.log('🔍 FirebaseService - searchByKeyword:', nameCollection, searchText);
        
        try {
            // Firestore doesn't support full-text search natively
            // Get all documents with limit and filter on client side
            const collectionRef = collection(this.firestore, nameCollection);
            const q = query(collectionRef, limit(100));

            return collectionData(q, { idField: 'id' }).pipe(
                map(data => {
                    const elements = data as ArElement[];
                    console.log('📦 Total elements retrieved:', elements.length);
                    
                    if (!searchText || searchText.trim() === '') {
                        return elements;
                    }

                    const searchLower = searchText.toLowerCase();
                    const filtered = elements.filter(element => 
                        element.name?.toLowerCase().includes(searchLower) ||
                        element.description?.toLowerCase().includes(searchLower) ||
                        element.title?.toLowerCase().includes(searchLower) ||
                        element.normalizedName?.toLowerCase().includes(searchLower)
                    );
                    
                    console.log('✅ Filtered results:', filtered.length);
                    return filtered;
                })
            );
        } catch (error) {
            console.error('❌ Error in searchByKeyword:', error);
            throw error;
        }
    }

    /**
     * Get lugares (places)
     */
    getLugares(code: string = 'general'): Observable<ArElement[]> {
        return this.getCollection('lugares', 50, '', '', 'codes', code);
    }
}
