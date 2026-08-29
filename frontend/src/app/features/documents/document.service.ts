import { HttpClient, HttpEvent } from '@angular/common/http';
import { inject, Injectable, Service } from '@angular/core';
import { Observable } from 'rxjs';

/**
 * Interface representing a Document entity.
 */
export interface Document {
  id?: string;
  name: string;
  content_type: string;
  blob_name?: string;
  keywords?: string[];
  src_url?: string;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface representing data required to create a new document with an attached file.
 */
export interface DocumentCreate {
  name: string;
  src_url?: string;
  keywords?: string[];
}

/**
 * Interface representing metadata fields that can be updated on a document.
 */
export interface DocumentPatch {
  name?: string | null;
  src_url?: string | null;
  keywords?: string[] | null;
}

@Service()
export class DocumentService {
  private readonly http = inject(HttpClient);

  public readonly endpoint = '/api/documents';

  /**
   * Creates a default empty Document object template.
   */
  new(): Document {
    return {
      name: '',
      content_type: '',
      blob_name: '',
      keywords: [],
      src_url: undefined,
    };
  }

  /**
   * Retrieves all documents.
   */
  getAll(): Observable<Document[]> {
    return this.http.get<Document[]>(this.endpoint);
  }

  /**
   * Retrieves a single document by its ID.
   *
   * @param documentId Document UUID
   */
  get(documentId: string): Observable<Document> {
    return this.http.get<Document>(`${this.endpoint}/${documentId}`);
  }

  /**
   * Uploads and creates a new document with its file payload (multipart/form-data).
   *
   * @param body Payload containing the binary file and document metadata
   */
  create(file: File, body: DocumentCreate): Observable<HttpEvent<Document>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content_type', file.type);
    formData.append('name', body.name);

    if (body.src_url) {
      formData.append('src_url', body.src_url);
    }
    if (body.keywords && body.keywords.length > 0) {
      body.keywords.forEach((keyword) => {
        formData.append('keywords', keyword);
      });
    }

    return this.http.post<Document>(this.endpoint, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }

  /**
   * Updates metadata of an existing document.
   *
   * @param documentId Document UUID
   * @param body Metadata fields to update
   */
  update(documentId: string, body: DocumentPatch): Observable<Document> {
    return this.http.patch<Document>(`${this.endpoint}/${documentId}`, body);
  }

  /**
   * Deletes a document by its ID.
   *
   * @param documentId Document UUID
   */
  delete(documentId: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${documentId}`);
  }

  /**
   * Downloads the raw binary content of a document.
   *
   * @param documentId Document UUID
   */
  downloadContent(documentId: string): Observable<Blob> {
    return this.http.get(`${this.endpoint}/${documentId}/content`, {
      responseType: 'blob',
    });
  }

  /**
   * Replaces/updates the binary file content of an existing document.
   *
   * @param documentId Document UUID
   * @param file New binary file to upload
   */
  updateContent(documentId: string, file: File | Blob): Observable<HttpEvent<void>> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.put<void>(`${this.endpoint}/${documentId}/content`, formData, {
      reportProgress: true,
      observe: 'events',
    });
  }
}
