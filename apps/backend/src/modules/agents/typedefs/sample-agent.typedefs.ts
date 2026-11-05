import type { FlowDocument } from '@agent-ic/flow';

export interface SampleLiveAgent {
  readonly name: string;
  readonly description: string;
  readonly note: string;
  readonly flow: FlowDocument;
}
