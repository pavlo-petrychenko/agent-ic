import {
  AGENT_DESCRIPTION_MAX_LENGTH,
  AGENT_NAME_MAX_LENGTH,
  AGENT_VERSION_NOTE_MAX_LENGTH,
  KNOWLEDGE_BASE_NAME_MAX_LENGTH,
} from '@agent-ic/contracts';
import { AgentTemplateKey, AgentTemplateKind, AgentTemplateKnowledgeRole } from '@agent-ic/flow';
import { z } from 'zod';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';
import { MAX_TEMPLATE_KNOWLEDGE_BASES } from '@/modules/agents/constants/agent-template.constants';
import { DRAFT_INITIAL_REVISION, PauseMode } from '@/modules/agents/constants/agent.constants';
import { mergeTemplateKnowledgeBases } from '@/modules/agents/helpers/agent-template.helpers';

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

export const rollbackAgentInputSchema = z.object({
  [AgentField.VersionId]: agentIdSchema,
  [AgentField.Revision]: z.int().min(DRAFT_INITIAL_REVISION),
  [AgentField.Note]: versionNoteSchema,
});

export const agentVersionDiffInputSchema = z.object({
  [AgentField.AgentId]: agentIdSchema,
  [AgentField.FromId]: agentIdSchema,
  [AgentField.ToId]: agentIdSchema,
});

export const testApiRequestInputSchema = z.object({
  [AgentField.AgentId]: agentIdSchema,
  [AgentField.NodeId]: z.string().min(1),
  [AgentField.Variables]: z
    .record(z.string(), z.unknown())
    .nullish()
    .transform((variables) => variables ?? {}),
});

export const listAgentTemplatesInputSchema = z.object({
  [AgentField.Kind]: z
    .enum(AgentTemplateKind)
    .nullish()
    .transform((kind) => kind ?? null),
});

const templateKnowledgeBaseIdsSchema = z.array(z.string().min(1)).max(MAX_TEMPLATE_KNOWLEDGE_BASES);

export const createAgentFromTemplateInputSchema = z.object({
  [AgentField.TemplateKey]: z.enum(AgentTemplateKey),
  [AgentField.Name]: agentNameSchema.nullish().transform((name) => name ?? null),
  [AgentField.KnowledgeBaseIds]: templateKnowledgeBaseIdsSchema
    .nullish()
    .transform((knowledgeBaseIds) => [...new Set(knowledgeBaseIds ?? [])]),
  [AgentField.KnowledgeBases]: z
    .array(
      z.object({
        [AgentField.Role]: z.enum(AgentTemplateKnowledgeRole),
        [AgentField.Ids]: templateKnowledgeBaseIdsSchema,
      }),
    )
    .max(MAX_TEMPLATE_KNOWLEDGE_BASES)
    .nullish()
    .transform((knowledgeBases) => mergeTemplateKnowledgeBases(knowledgeBases ?? [])),
  [AgentField.NewKnowledgeBases]: z
    .array(
      z.object({
        [AgentField.Role]: z
          .enum(AgentTemplateKnowledgeRole)
          .nullish()
          .transform((role) => role ?? null),
        [AgentField.Name]: z.string().trim().min(1).max(KNOWLEDGE_BASE_NAME_MAX_LENGTH),
      }),
    )
    .max(MAX_TEMPLATE_KNOWLEDGE_BASES)
    .nullish()
    .transform((newKnowledgeBases) => newKnowledgeBases ?? []),
});
