import { RequestBodyKind } from '@agent-ic/flow';

export const CONTENT_TYPE_HEADER = 'content-type';

export const API_REQUEST_CONTENT_TYPE: Readonly<Record<RequestBodyKind, string | null>> = {
  [RequestBodyKind.None]: null,
  [RequestBodyKind.Json]: 'application/json',
  [RequestBodyKind.Text]: 'text/plain; charset=utf-8',
};
