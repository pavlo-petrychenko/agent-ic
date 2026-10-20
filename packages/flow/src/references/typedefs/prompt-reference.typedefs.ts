import type { PromptSource } from '@flow/document/typedefs/flow.typedefs';

export type PromptPin = PromptSource['pin'];
export type PromptBindings = PromptSource['bindings'];

export interface PromptReference {
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
  readonly promptRef: string;
  readonly pin: PromptPin;
  readonly bindings: PromptBindings;
}
