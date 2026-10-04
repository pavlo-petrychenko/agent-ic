export abstract class RateLimitPolicy {
  abstract readonly name: string;
  abstract readonly capacity: number;
  abstract readonly refillPerSecond: number;
}
