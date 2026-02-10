import { Injectable, inject } from '@angular/core';
import {
    Firestore,
    collection,
    doc,
    collectionData,
    docData,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    QueryConstraint,
    DocumentReference,
    CollectionReference
} from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';
import { IRepository } from '../interfaces/services.interface';

/**
 * Generic Firestore Repository
 * Implements Repository Pattern
 * Follows Single Responsibility Principle (SRP) - Only handles Firestore operations
 * Follows Open/Closed Principle (OCP) - Open for extension via generics
 * Follows Dependency Inversion Principle (DIP) - Depends on IRepository interface
 * 
 * @template T Entity type
 */
@Injectable({
    providedIn: 'root'
})
export class FirestoreRepository<T extends { id?: string }> implements IRepository<T> {
    protected firestore = inject(Firestore);
    protected collectionName!: string;

    /**
     * Get collection reference
     */
    protected getCollection(): CollectionReference {
        return collection(this.firestore, this.collectionName);
    }

    /**
     * Get all documents from collection
     */
    getAll(): Observable<T[]> {
        const collectionRef = this.getCollection();
        return collectionData(collectionRef, { idField: 'id' }) as Observable<T[]>;
    }

    /**
     * Get documents with query constraints
     * @param constraints Firestore query constraints
     */
    getWithQuery(...constraints: QueryConstraint[]): Observable<T[]> {
        const collectionRef = this.getCollection();
        const q = query(collectionRef, ...constraints);
        return collectionData(q, { idField: 'id' }) as Observable<T[]>;
    }

    /**
     * Get document by ID
     * @param id Document ID
     */
    getById(id: string): Observable<T | null> {
        const docRef = doc(this.firestore, this.collectionName, id);
        return docData(docRef, { idField: 'id' }).pipe(
            map(data => data as T || null)
        );
    }

    /**
     * Create new document
     * @param item Item to create (without id, createdAt, updatedAt)
     */
    create(item: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Observable<T> {
        const collectionRef = this.getCollection();
        const timestamp = new Date();
        const newItem: any = {
            ...item,
            createdAt: timestamp,
            updatedAt: timestamp
        };

        return from(addDoc(collectionRef, newItem)).pipe(
            map(docRef => ({
                ...newItem,
                id: docRef.id
            } as T))
        );
    }

    /**
     * Update existing document
     * @param id Document ID
     * @param item Partial item data to update
     */
    update(id: string, item: Partial<T>): Observable<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        const updateData: any = {
            ...item,
            updatedAt: new Date()
        };

        return from(updateDoc(docRef, updateData));
    }

    /**
     * Delete document
     * @param id Document ID
     */
    delete(id: string): Observable<void> {
        const docRef = doc(this.firestore, this.collectionName, id);
        return from(deleteDoc(docRef));
    }

    /**
     * Query helper: Get documents where field equals value
     * @param field Field name
     * @param value Field value
     */
    getWhere(field: string, value: any): Observable<T[]> {
        return this.getWithQuery(where(field, '==', value));
    }

    /**
     * Query helper: Get documents ordered by field
     * @param field Field name
     * @param direction Sort direction
     */
    getOrdered(field: string, direction: 'asc' | 'desc' = 'asc'): Observable<T[]> {
        return this.getWithQuery(orderBy(field, direction));
    }

    /**
     * Query helper: Get limited number of documents
     * @param limitCount Number of documents to return
     */
    getLimited(limitCount: number): Observable<T[]> {
        return this.getWithQuery(limit(limitCount));
    }
}

/**
 * Product Repository
 * Extends generic FirestoreRepository for Product entities
 * Follows Open/Closed Principle (OCP) - Extends base repository
 */
@Injectable({
    providedIn: 'root'
})
export class ProductRepository extends FirestoreRepository<any> {
    constructor() {
        super();
        this.collectionName = 'products';
    }

    /**
     * Get products by type
     * @param type Product type
     */
    getByType(type: string): Observable<any[]> {
        return this.getWhere('type', type);
    }

    /**
     * Get active products
     */
    getActive(): Observable<any[]> {
        return this.getWhere('isActive', true);
    }

    /**
     * Get products by seller
     * @param sellerId Seller user ID
     */
    getBySeller(sellerId: string): Observable<any[]> {
        return this.getWhere('sellerId', sellerId);
    }
}

/**
 * User Repository
 * Extends generic FirestoreRepository for User entities
 */
@Injectable({
    providedIn: 'root'
})
export class UserRepository extends FirestoreRepository<any> {
    constructor() {
        super();
        this.collectionName = 'users';
    }

    /**
     * Get user by email
     * @param email User email
     */
    getByEmail(email: string): Observable<any | null> {
        return this.getWhere('email', email).pipe(
            map(users => users.length > 0 ? users[0] : null)
        );
    }
}

/**
 * Order Repository
 * Extends generic FirestoreRepository for Order entities
 */
@Injectable({
    providedIn: 'root'
})
export class OrderRepository extends FirestoreRepository<any> {
    constructor() {
        super();
        this.collectionName = 'orders';
    }

    /**
     * Get orders by user
     * @param userId User ID
     */
    getByUser(userId: string): Observable<any[]> {
        return this.getWhere('userId', userId);
    }

    /**
     * Get orders by status
     * @param status Order status
     */
    getByStatus(status: string): Observable<any[]> {
        return this.getWhere('status', status);
    }
}
