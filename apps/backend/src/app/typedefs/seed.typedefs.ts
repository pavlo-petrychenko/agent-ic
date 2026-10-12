export interface SeedResult {
  readonly userId: string;
  readonly workspaceId: string;
  readonly agentCreated: boolean;
  readonly examplesWorkspaceId: string;
  readonly examplesCreated: boolean;
}
