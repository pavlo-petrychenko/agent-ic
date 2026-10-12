import type { FlowDocument } from '@agent-ic/flow';

export interface SampleFlowIds {
  readonly nodes: {
    readonly trigger: string;
    readonly route: string;
    readonly greeting: string;
    readonly handOff: string;
  };
  readonly rule: string;
  readonly edges: readonly [string, string, string];
}

export interface SampleLiveAgent {
  readonly name: string;
  readonly description: string;
  readonly note: string;
  readonly flow: FlowDocument;
}
