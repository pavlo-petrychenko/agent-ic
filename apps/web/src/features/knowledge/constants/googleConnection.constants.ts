export enum AddSourceType {
  Upload = 'upload',
  GoogleDocs = 'google_docs',
}

export enum KnowledgeGoogleSearchParam {
  Connected = 'connected',
}

export enum GoogleCallbackFailureReason {
  Denied = 'denied',
  Invalid = 'invalid',
  MissingReturn = 'missingReturn',
}

export const GOOGLE_CONNECTION_RETURN_STORAGE_KEY = 'agent-ic-google-connection-return';
