export interface WorkspaceStepValues {
  readonly name: string;
}

export interface CreateWorkspaceRequest {
  readonly name: string;
  readonly timeZone: string;
}
