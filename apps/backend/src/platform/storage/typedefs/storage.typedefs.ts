export interface StoredObject {
  readonly key: string;
  readonly size: number;
  readonly contentType: string | null;
  readonly etag: string | null;
}

export interface PresignedPutRequest {
  readonly key: string;
  readonly contentType: string;
  readonly expiresInSeconds: number;
}

export interface PresignedGetRequest {
  readonly key: string;
  readonly expiresInSeconds: number;
}
