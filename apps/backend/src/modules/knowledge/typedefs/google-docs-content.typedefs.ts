import type { Connection } from '@/modules/knowledge/typedefs/connection.typedefs';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { GoogleDriveFile } from '@/modules/knowledge/typedefs/google-drive.typedefs';
import type { GoogleAccessToken } from '@/modules/knowledge/typedefs/google-oauth.typedefs';

export interface ExportGoogleDocsInput {
  readonly workspaceId: string;
  readonly document: Document;
  readonly connection: Connection;
}

export interface GoogleDocsFileSnapshot {
  readonly file: GoogleDriveFile;
  readonly accessToken: GoogleAccessToken;
}

export interface ExportGoogleDocsContentInput {
  readonly workspaceId: string;
  readonly document: Document;
  readonly snapshot: GoogleDocsFileSnapshot;
}

export interface GoogleDocsContent {
  readonly storageKey: string;
  readonly fileName: string;
  readonly mimeType: string;
  readonly bytes: Buffer;
  readonly file: GoogleDriveFile;
}
