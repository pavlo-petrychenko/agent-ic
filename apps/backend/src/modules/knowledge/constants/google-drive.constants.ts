export const GOOGLE_DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
export const GOOGLE_DRIVE_FILES_PATH = 'files';
export const GOOGLE_DRIVE_FILE_FIELDS = 'id,name,mimeType,webViewLink,modifiedTime,version,trashed';
export const GOOGLE_DRIVE_DOCUMENT_MIME_TYPE = 'application/vnd.google-apps.document';
export const GOOGLE_DRIVE_EXPORT_MIME_TYPE = 'text/markdown';
export const GOOGLE_DRIVE_RESOURCE_KEY_HEADER = 'X-Goog-Drive-Resource-Keys';
export const GOOGLE_DRIVE_TIMEOUT_MS = 10_000;
export const GOOGLE_PICKER_MAX_DOCUMENTS = 50;
export const GOOGLE_PICKER_SOURCE_TITLE_PREFIX = 'Google Docs';
export const GOOGLE_DRIVE_DEFAULT_VERSION = 'google';

export enum GooglePickerSkipReason {
  Unavailable = 'unavailable',
  Unsupported = 'unsupported',
  Trashed = 'trashed',
}
