import type { StepData } from '@/modules/runs/typedefs/run-step.typedefs';
import type { RunToolCall } from '@/modules/runs/typedefs/tool-call.typedefs';
import type { LlmTranscriptMessage } from '@/platform/llm/typedefs/llm-transcript.typedefs';

export interface StepTranscript {
  readonly runId: string;
  readonly nodeId: string;
  readonly transcript: readonly LlmTranscriptMessage[];
  readonly output: StepData | null;
}

export interface StepTrace {
  readonly toolCalls: readonly RunToolCall[];
  readonly transcript: readonly LlmTranscriptMessage[];
}

export interface RunTranscript {
  readonly transcript: readonly LlmTranscriptMessage[];
  readonly sentTexts: ReadonlySet<string>;
}
