import { WORKSPACE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';

interface WorkspaceNameSchemaMessages {
  readonly name: string;
}

export const createWorkspaceNameSchema = (messages: WorkspaceNameSchemaMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.name).max(WORKSPACE_NAME_MAX_LENGTH, messages.name),
  });
