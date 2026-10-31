export interface GoogleDriveFile {
  readonly id: string;
  readonly name: string;
  readonly mimeType: string;
  readonly webViewLink: string | null;
  readonly modifiedTime: string | null;
  readonly version: string | null;
  readonly trashed: boolean;
}
