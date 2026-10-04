export enum RequestHeader {
  Authorization = 'authorization',
  ContentType = 'content-type',
  WorkspaceId = 'x-workspace-id',
}

export enum ConnectionParam {
  Authorization = 'authorization',
  WorkspaceId = 'x-workspace-id',
}

export const BEARER_SCHEME = 'Bearer';
export const JSON_CONTENT_TYPE = 'application/json';
export const UNAUTHENTICATED_RETRIED_CONTEXT_KEY = 'unauthenticatedRetried';
