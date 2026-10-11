import {
  API_REQUEST_MAX_TIMEOUT_SECONDS,
  FailureMode,
  HttpMethod,
  RequestBodyKind,
} from '@agent-ic/flow';
import { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type { ApiTestState } from '@/features/flow-builder/typedefs/apiRequest.typedefs';

export const HTTP_METHODS: readonly HttpMethod[] = Object.values(HttpMethod);

export const BODY_KINDS: readonly RequestBodyKind[] = Object.values(RequestBodyKind);

export const FAILURE_MODES: readonly FailureMode[] = [FailureMode.Continue, FailureMode.ErrorPort];

const TIMEOUT_STEPS: readonly number[] = [1, 2, 5, 10, 15, 20, 30, 45, 60];

export const TIMEOUT_SECONDS: readonly number[] = TIMEOUT_STEPS.filter(
  (seconds) => seconds <= API_REQUEST_MAX_TIMEOUT_SECONDS,
);

export const NEW_HEADER = { name: 'Accept', value: 'application/json' };

export const HTTP_ERROR_STATUS = 400;

export const HEADER_PARTS = [IssuePathSegment.Name, IssuePathSegment.Value] as const;

export enum ApiOutputHint {
  Ok = 'ok',
  Status = 'status',
  Body = 'body',
}

export const API_OUTPUT_HINTS: Readonly<Record<string, ApiOutputHint>> = {
  ok: ApiOutputHint.Ok,
  status: ApiOutputHint.Status,
  body: ApiOutputHint.Body,
};

export const META_JOINER = ' · ';

export const IDLE_API_TEST: ApiTestState = { result: null, running: false, failed: false };
