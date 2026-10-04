export interface UpstreamErrorOptions {
  readonly retryable: boolean;
  readonly cause?: unknown;
}
