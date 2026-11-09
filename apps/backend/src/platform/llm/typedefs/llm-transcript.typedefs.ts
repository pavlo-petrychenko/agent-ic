import type { ModelMessage } from 'ai';

export type LlmTranscriptMessage = ModelMessage;

export interface LlmTranscript {
  readonly transcript: readonly LlmTranscriptMessage[];
}

export interface LlmReplay {
  readonly messages: ModelMessage[];
  readonly nextIndex: number;
}
