export interface RateLimitPolicy {
  readonly name: string;
  readonly capacity: number;
  readonly refillPerSecond: number;
}

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly retryAfterMs: number;
}
