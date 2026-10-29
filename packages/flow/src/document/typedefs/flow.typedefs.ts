import type { z } from 'zod';
import type {
  conditionSchema,
  conditionValueSchema,
  routerRuleSchema,
} from '@flow/conditions/schemas/condition.schema';
import type { flowEdgeSchema } from '@flow/document/schemas/edge.schema';
import type { flowDocumentSchema } from '@flow/document/schemas/flow.schema';
import type { flowNodeSchema } from '@flow/document/schemas/node.schema';
import type {
  agentExitSchema,
  agentExitsSchema,
  agentNodeSchema,
} from '@flow/nodes/schemas/agent.schema';
import type { apiRequestNodeSchema } from '@flow/nodes/schemas/api-request.schema';
import type { completionNodeSchema } from '@flow/nodes/schemas/completion.schema';
import type { escalationNodeSchema } from '@flow/nodes/schemas/escalation.schema';
import type { parallelNodeSchema } from '@flow/nodes/schemas/parallel.schema';
import type { routerNodeSchema } from '@flow/nodes/schemas/router.schema';
import type { sendMessageNodeSchema } from '@flow/nodes/schemas/send-message.schema';
import type { triggerExternalEventNodeSchema } from '@flow/nodes/schemas/trigger-external-event.schema';
import type {
  inactivityDurationSchema,
  triggerInactivityNodeSchema,
} from '@flow/nodes/schemas/trigger-inactivity.schema';
import type { triggerMessageNodeSchema } from '@flow/nodes/schemas/trigger-message.schema';
import type { triggerScheduleNodeSchema } from '@flow/nodes/schemas/trigger-schedule.schema';
import type { outputFieldSchema } from '@flow/outputs/schemas/output-field.schema';
import type { modelRefSchema } from '@flow/references/schemas/model-ref.schema';
import type { promptSourceSchema } from '@flow/references/schemas/prompt-source.schema';
import type {
  autoCloseSettingsSchema,
  flowSettingsSchema,
  handoffSettingsSchema,
  unhandledFailureSettingsSchema,
} from '@flow/settings/schemas/flow-settings.schema';

export type FlowDocument = z.infer<typeof flowDocumentSchema>;
export type FlowNode = z.infer<typeof flowNodeSchema>;
export type FlowEdge = z.infer<typeof flowEdgeSchema>;
export type FlowSettings = z.infer<typeof flowSettingsSchema>;
export type HandoffSettings = z.infer<typeof handoffSettingsSchema>;
export type UnhandledFailureSettings = z.infer<typeof unhandledFailureSettingsSchema>;
export type AutoCloseSettings = z.infer<typeof autoCloseSettingsSchema>;
export type AgentExit = z.infer<typeof agentExitSchema>;
export type AgentExits = z.infer<typeof agentExitsSchema>;

export type TriggerMessageNode = z.infer<typeof triggerMessageNodeSchema>;
export type TriggerExternalEventNode = z.infer<typeof triggerExternalEventNodeSchema>;
export type TriggerScheduleNode = z.infer<typeof triggerScheduleNodeSchema>;
export type TriggerInactivityNode = z.infer<typeof triggerInactivityNodeSchema>;
export type InactivityDuration = z.infer<typeof inactivityDurationSchema>;
export type AgentNode = z.infer<typeof agentNodeSchema>;
export type CompletionNode = z.infer<typeof completionNodeSchema>;
export type RouterNode = z.infer<typeof routerNodeSchema>;
export type ParallelNode = z.infer<typeof parallelNodeSchema>;
export type ApiRequestNode = z.infer<typeof apiRequestNodeSchema>;
export type SendMessageNode = z.infer<typeof sendMessageNodeSchema>;
export type EscalationNode = z.infer<typeof escalationNodeSchema>;
export type TriggerNode =
  | TriggerMessageNode
  | TriggerExternalEventNode
  | TriggerScheduleNode
  | TriggerInactivityNode;

export type OutputField = z.infer<typeof outputFieldSchema>;
export type PromptSource = z.infer<typeof promptSourceSchema>;
export type ModelRef = z.infer<typeof modelRefSchema>;
export type Condition = z.infer<typeof conditionSchema>;
export type ConditionValue = z.infer<typeof conditionValueSchema>;
export type RouterRule = z.infer<typeof routerRuleSchema>;
