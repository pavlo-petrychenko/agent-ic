import { can, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';

const hasPromptPermission = (role: WorkspaceRole | null, action: PermissionAction): boolean =>
  role !== null && can(role, PermissionResource.Prompts, action);

export const canEditPrompt = (role: WorkspaceRole | null): boolean =>
  hasPromptPermission(role, PermissionAction.Edit);

export const promptMenuActions = (role: WorkspaceRole | null): readonly PromptMenuAction[] => [
  ...(canEditPrompt(role)
    ? [PromptMenuAction.Rename, PromptMenuAction.Move, PromptMenuAction.Duplicate]
    : []),
  ...(hasPromptPermission(role, PermissionAction.Delete) ? [PromptMenuAction.Delete] : []),
];
