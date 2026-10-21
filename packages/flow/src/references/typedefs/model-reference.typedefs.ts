import type { ModelRef } from '@flow/document/typedefs/flow.typedefs';

export interface ModelReference {
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
  readonly provider: ModelRef['provider'];
  readonly model: string;
}
