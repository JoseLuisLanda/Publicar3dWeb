import { Injectable, inject } from '@angular/core';
import {
    Storage,
    ref,
    uploadBytesResumable,
    getDownloadURL,
    deleteObject,
    UploadTask
} from '@angular/fire/storage';
import { Observable, from, Subject } from 'rxjs';
import { IStorageService } from '../interfaces/services.interface';

/**
 * Firebase Storage Service
 * Implements Single Responsibility Principle (SRP) - Only handles file storage
 * Implements Dependency Inversion Principle (DIP) - Depends on IStorageService interface
 */
@Injectable({
    providedIn: 'root'
})
export class StorageService implements IStorageService {
    private storage = inject(Storage);

    /**
     * Upload file to Firebase Storage
     * @param path Storage path
     * @param file File to upload
     * @returns Observable with upload progress and final URL
     */
    upload(path: string, file: File): Observable<{ url: string; progress: number }> {
        const storageRef = ref(this.storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        const subject = new Subject<{ url: string; progress: number }>();

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                // Calculate progress percentage
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                subject.next({ url: '', progress });
            },
            (error) => {
                // Handle upload error
                subject.error(error);
            },
            async () => {
                // Upload completed, get download URL
                try {
                    const url = await getDownloadURL(uploadTask.snapshot.ref);
                    subject.next({ url, progress: 100 });
                    subject.complete();
                } catch (error) {
                    subject.error(error);
                }
            }
        );

        return subject.asObservable();
    }

    /**
     * Delete file from Firebase Storage
     * @param path Storage path
     */
    async delete(path: string): Promise<void> {
        const storageRef = ref(this.storage, path);
        await deleteObject(storageRef);
    }

    /**
     * Get download URL for a file
     * @param path Storage path
     */
    async getDownloadURL(path: string): Promise<string> {
        const storageRef = ref(this.storage, path);
        return await getDownloadURL(storageRef);
    }

    /**
     * Upload multiple files
     * @param basePath Base storage path
     * @param files Array of files to upload
     */
    uploadMultiple(basePath: string, files: File[]): Observable<{ url: string; progress: number }[]> {
        const uploads = files.map((file, index) => {
            const path = `${basePath}/${Date.now()}_${index}_${file.name}`;
            return this.upload(path, file);
        });

        return new Observable(observer => {
            const results: { url: string; progress: number }[] = [];
            let completed = 0;

            uploads.forEach((upload$, index) => {
                upload$.subscribe({
                    next: (result) => {
                        results[index] = result;
                        observer.next([...results]);
                    },
                    error: (error) => observer.error(error),
                    complete: () => {
                        completed++;
                        if (completed === files.length) {
                            observer.complete();
                        }
                    }
                });
            });
        });
    }
}
