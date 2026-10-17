import type { PromptSource } from '@flow/document/typedefs/flow.typedefs';
import type { PromptSourceKind } from '@flow/references/constants/reference.constants';

export type PromptPin = Extract<PromptSource, { kind: PromptSourceKind.Library }>['pin'];

export interface PromptReference {
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly promptRef: string;
  readonly pin: PromptPin;
}
