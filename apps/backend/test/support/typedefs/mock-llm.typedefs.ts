import type { MockLlmStepKind } from '@test/support/constants/mock-llm.constants';

export interface MockLlmUsage {
  readonly promptTokens: number;
  readonly completionTokens: number;
}

export type MockLlmStep =
  | { readonly kind: MockLlmStepKind.Reply; readonly args: unknown; readonly usage: MockLlmUsage }
  | { readonly kind: MockLlmStepKind.Text; readonly text: string; readonly usage: MockLlmUsage }
  | { readonly kind: MockLlmStepKind.Fail; readonly status: number }
  | { readonly kind: MockLlmStepKind.Hang }
  | { readonly kind: MockLlmStepKind.Embed; readonly dimensions: number };

export interface MockLlmRequest {
  readonly route: string;
  readonly authorization: string | null;
  readonly body: Readonly<Record<string, unknown>>;
}

export interface MockLlmResponse {
  readonly status: number;
  readonly body: unknown;
}

export interface MockToolCallBody {
  readonly id: string;
  readonly type: string;
  readonly function: { readonly name: string; readonly arguments: string };
}

export interface MockChatCompletionBody {
  readonly model: unknown;
  readonly choices: readonly {
    readonly index: number;
    readonly finish_reason: string;
    readonly message: {
      readonly role: string;
      readonly content: string | null;
      readonly tool_calls?: readonly MockToolCallBody[];
    };
  }[];
  readonly usage: Readonly<Record<string, number>>;
}

export interface MockEmbeddingsBody {
  readonly model: unknown;
  readonly data: readonly { readonly index: number; readonly embedding: readonly number[] }[];
  readonly usage: Readonly<Record<string, number>>;
}
