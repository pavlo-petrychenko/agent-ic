import { ErrorReason } from '@agent-ic/contracts';
import type { ReasonFieldMap } from '@/features/auth/typedefs/authForm.typedefs';
import type { WorkspaceStepValues } from '@/features/auth/typedefs/workspaceStep.typedefs';

export enum WorkspaceSetupChoice {
  Create = 'create',
  Join = 'join',
}

export enum WorkspaceStepField {
  Name = 'name',
}

export const WORKSPACE_SETUP_GROUP = 'workspace-setup';

export const EMPTY_WORKSPACE_STEP_VALUES: WorkspaceStepValues = { name: '' };

export const WORKSPACE_STEP_REASON_FIELDS: ReasonFieldMap = {
  [ErrorReason.InvalidWorkspaceName]: WorkspaceStepField.Name,
};
