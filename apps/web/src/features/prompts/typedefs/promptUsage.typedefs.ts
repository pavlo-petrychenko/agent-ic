export interface PromptUsageItem {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly live: boolean;
  readonly versionNumber: number | null;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
  readonly pinned: boolean;
  readonly pinNumber: number | null;
}

export interface UsePromptUsagesResult {
  readonly usages: readonly PromptUsageItem[] | null;
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => Promise<void>;
}
