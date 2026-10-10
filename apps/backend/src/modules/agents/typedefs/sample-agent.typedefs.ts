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
