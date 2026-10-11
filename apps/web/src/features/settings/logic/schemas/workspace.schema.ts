import { WORKSPACE_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';

interface WorkspaceSchemaMessages {
  readonly name: string;
  readonly timeZone: string;
}

export const createWorkspaceSchema = (messages: WorkspaceSchemaMessages) =>
  z.object({
    name: z.string().trim().min(1, messages.name).max(WORKSPACE_NAME_MAX_LENGTH, messages.name),
    timeZone: z.string().min(1, messages.timeZone),
  });
