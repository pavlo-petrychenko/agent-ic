export enum ReasoningLevel {
  None = 'none',
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  XHigh = 'xhigh',
  Max = 'max',
}

export const REASONING_LEVEL_ORDER: readonly ReasoningLevel[] = [
  ReasoningLevel.None,
  ReasoningLevel.Low,
  ReasoningLevel.Medium,
  ReasoningLevel.High,
  ReasoningLevel.XHigh,
  ReasoningLevel.Max,
];
