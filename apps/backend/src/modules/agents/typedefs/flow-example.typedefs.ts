import type { FailureMode, FlowEdge, FlowNode, FlowSettings, HttpMethod } from '@agent-ic/flow';

export type GridCell = readonly [column: number, row: number];

export type FlowExampleEdge = Omit<FlowEdge, 'id'>;

export interface FlowExample {
  readonly name: string;
  readonly description: string;
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly FlowExampleEdge[];
  readonly settings?: FlowSettings;
}

export interface ExampleRequest {
  readonly method: HttpMethod;
  readonly url: string;
  readonly body: string | null;
  readonly onFailure: FailureMode;
}
