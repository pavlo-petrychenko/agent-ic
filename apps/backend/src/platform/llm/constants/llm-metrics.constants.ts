export enum LlmMetricName {
  Calls = 'llm_calls_total',
  CallDuration = 'llm_call_duration_seconds',
  Fallbacks = 'llm_fallbacks_total',
  OutputRetries = 'llm_output_retries_total',
  ReplyNudges = 'llm_reply_nudges_total',
}

export enum LlmMetricHelp {
  Calls = 'LLM gateway calls by operation, requested model and outcome',
  CallDuration = 'Duration of LLM gateway calls in seconds, fallbacks included',
  Fallbacks = 'Times a model was unavailable and the gateway moved on to its fallback',
  OutputRetries = 'Times a model answer did not match the schema and was asked again',
  ReplyNudges = 'Times a reply-tool model ended in plain text and was nudged',
}

export enum LlmMetricLabel {
  Operation = 'operation',
  Model = 'model',
  Outcome = 'outcome',
  Fallback = 'fallback',
}

export enum LlmOperation {
  Complete = 'complete',
  Agent = 'agent',
}

export enum LlmCallOutcome {
  Answered = 'answered',
  Failed = 'failed',
}

export const LLM_CALL_DURATION_BUCKETS_SECONDS: readonly number[] = [
  0.25, 0.5, 1, 2, 5, 10, 20, 30, 60,
];
