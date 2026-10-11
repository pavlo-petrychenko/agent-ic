import { FailureMode, HttpMethod } from '@agent-ic/flow';

export const HTTP_METHODS: readonly HttpMethod[] = Object.values(HttpMethod);

export const FAILURE_MODES: readonly FailureMode[] = [FailureMode.Continue, FailureMode.ErrorPort];

export const TIMEOUT_SECONDS: readonly number[] = [1, 2, 5, 10, 15, 20, 30];

export const HTTP_ERROR_STATUS = 400;

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
