import { AGENT_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { z } from 'zod';
import { AgentField } from '@/modules/agents/constants/agent-input.constants';

const agentNameSchema = z.string().trim().min(1).max(AGENT_NAME_MAX_LENGTH);
const agentIdSchema = z.string().min(1);

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
