import { HttpClient } from '@angular/common/http';
import { inject, Service } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Metadata associated with a stored blob/file.
 */
export interface BaseBlobMetadata {
    content_type?: string;
    filename?: string | null;
}

/**
 * Blob header containing file name and its metadata.
 */
export interface BlobHeader {
    name: string;
    metadata: BaseBlobMetadata;
}

@Service()
export class FileService {
    private readonly http = inject(HttpClient);

    public readonly endpoint = '/api/files';

    /**
     * Retrieves the list of all files metadata headers.
     *
     * @returns Observable containing an array of BlobHeader objects.
     */
    getAll(): Observable<BlobHeader[]> {
        return this.http.get<BlobHeader[]>(this.endpoint);
    }

    /**
     * Uploads a new file.
     *
     * @param file The file object (Blob/File) to upload.
     * @returns Observable containing the uploaded file header.
     */
    upload(file: File | Blob, filename?: string): Observable<BlobHeader> {
        const formData = new FormData();
        if (filename) {
            formData.append('file', file, filename);
        } else {
            formData.append('file', file);
        }

        return this.http.post<BlobHeader>(this.endpoint, formData);
    }

    /**
     * Downloads a specific file as a Blob by its file name.
     *
     * @param fileName The name of the file to download.
     * @returns Observable containing the downloaded binary data as a Blob.
     */
    download(fileName: string): Observable<Blob> {
        return this.http.get(`${this.endpoint}/${encodeURIComponent(fileName)}`, {
            responseType: 'blob',
        });
    }

    /**
     * Replaces or updates an existing file by its file name.
     *
     * @param fileName The name of the target file.
     * @param file The new file content.
     * @returns Observable that resolves when the update completes.
     */
    update(fileName: string, file: File | Blob): Observable<void> {
        const formData = new FormData();
        formData.append('file', file);

        return this.http.put<void>(
            `${this.endpoint}/${encodeURIComponent(fileName)}`,
            formData
        );
    }

    /**
     * Deletes a file by its file name.
     *
     * @param fileName The name of the file to delete.
     * @returns Observable that resolves when deletion completes.
     */
    delete(fileName: string): Observable<void> {
        return this.http.delete<void>(
            `${this.endpoint}/${encodeURIComponent(fileName)}`
        );
    }
}
