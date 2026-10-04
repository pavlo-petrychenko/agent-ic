import { WORKSPACE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';

interface WorkspaceStepSchemaMessages {
  readonly name: string;
}

export const createWorkspaceStepSchema = (messages: WorkspaceStepSchemaMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.name).max(WORKSPACE_NAME_MAX_LENGTH, messages.name),
  });
