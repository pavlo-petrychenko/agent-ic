import type { z } from 'zod';
import type {
  conditionSchema,
  conditionValueSchema,
  routerRuleSchema,
} from '../../conditions/schemas/condition.schema';
import type { agentNodeSchema } from '../../nodes/schemas/agent.schema';
import type { apiRequestNodeSchema } from '../../nodes/schemas/api-request.schema';
import type { completionNodeSchema } from '../../nodes/schemas/completion.schema';
import type { escalationNodeSchema } from '../../nodes/schemas/escalation.schema';
import type { parallelNodeSchema } from '../../nodes/schemas/parallel.schema';
import type { routerNodeSchema } from '../../nodes/schemas/router.schema';
import type { sendMessageNodeSchema } from '../../nodes/schemas/send-message.schema';
import type { triggerExternalEventNodeSchema } from '../../nodes/schemas/trigger-external-event.schema';
import type { triggerMessageNodeSchema } from '../../nodes/schemas/trigger-message.schema';
import type { triggerScheduleNodeSchema } from '../../nodes/schemas/trigger-schedule.schema';
import type { outputFieldSchema } from '../../outputs/schemas/output-field.schema';
import type { modelRefSchema } from '../../references/schemas/model-ref.schema';
import type { promptRefSchema } from '../../references/schemas/prompt-ref.schema';
import type { flowEdgeSchema } from '../schemas/edge.schema';
import type { flowDocumentSchema } from '../schemas/flow.schema';
import type { flowNodeSchema } from '../schemas/node.schema';

export type FlowDocument = z.infer<typeof flowDocumentSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;

export type TriggerMessageNode = z.infer<typeof triggerMessageNodeSchema>;
export type TriggerExternalEventNode = z.infer<typeof triggerExternalEventNodeSchema>;
export type TriggerScheduleNode = z.infer<typeof triggerScheduleNodeSchema>;
export type AgentNode = z.infer<typeof agentNodeSchema>;
export type CompletionNode = z.infer<typeof completionNodeSchema>;
export type RouterNode = z.infer<typeof routerNodeSchema>;
export type ParallelNode = z.infer<typeof parallelNodeSchema>;
export type ApiRequestNode = z.infer<typeof apiRequestNodeSchema>;
export type SendMessageNode = z.infer<typeof sendMessageNodeSchema>;
export type EscalationNode = z.infer<typeof escalationNodeSchema>;
export type TriggerNode = TriggerMessageNode | TriggerExternalEventNode | TriggerScheduleNode;

export type OutputField = z.infer<typeof outputFieldSchema>;
export type PromptRef = z.infer<typeof promptRefSchema>;
export type ModelRef = z.infer<typeof modelRefSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type ConditionValue = z.infer<typeof conditionValueSchema>;
export type RouterRule = z.infer<typeof routerRuleSchema>;
