import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  AGENT_VERSION_NOTE_MAX_LENGTH,
} from '@agent-ic/contracts';
import { z } from 'zod';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';
import { DRAFT_INITIAL_REVISION, PauseMode } from '@/modules/agents/constants/agent.constants';

const agentNameSchema = z.string().trim().min(1).max(AGENT_NAME_MAX_LENGTH);
const agentIdSchema = z.string().min(1);
const agentDescriptionSchema = z
  .string()
  .trim()
  .max(AGENT_DESCRIPTION_MAX_LENGTH)
  .nullish()
  .transform((description) => {
    const text = description ?? '';
    return text.length === 0 ? null : text;
  });
const versionNoteSchema = z.string().trim().max(AGENT_VERSION_NOTE_MAX_LENGTH).nullish();

export const createAgentInputSchema = z.object({
  [AgentField.Name]: agentNameSchema,
});

export const renameAgentInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
  [AgentField.Name]: agentNameSchema,
});

export const agentIdInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
});

export const describeAgentInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
  [AgentField.Description]: agentDescriptionSchema,
});

export const publishAgentInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
  [AgentField.Note]: versionNoteSchema,
});

export const saveAgentDraftInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
  [AgentField.Flow]: z.looseObject({}),
  [AgentField.Revision]: z.int().min(DRAFT_INITIAL_REVISION),
  [AgentField.Note]: versionNoteSchema,
});

export const listAgentVersionsInputSchema = z.object({
  [AgentField.AgentId]: agentIdSchema,
});

export const agentDraftInputSchema = z.object({
  [AgentField.AgentId]: agentIdSchema,
});

export const pauseAgentInputSchema = z.object({
  [AgentField.Id]: agentIdSchema,
  [AgentField.Mode]: z.enum(PauseMode),
  [AgentField.AwayMessage]: z.string().nullish(),
});

export const restoreAgentVersionInputSchema = z.object({
  [AgentField.VersionId]: agentIdSchema,
  [AgentField.Revision]: z.int().min(DRAFT_INITIAL_REVISION),
});

export const agentVersionDiffInputSchema = z.object({
  [AgentField.AgentId]: agentIdSchema,
  [AgentField.FromId]: agentIdSchema,
  [AgentField.ToId]: agentIdSchema,
});
