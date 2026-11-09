import {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
} from '@agent-ic/flow';
import type { AgentTemplateView } from '@/modules/agents/typedefs/agent-template.typedefs';
import type { AgentTemplate as GraphqlAgentTemplate } from '@/platform/graphql-server/generated/schema.generated';
import {
  AgentTemplateCategory as GraphqlAgentTemplateCategory,
  AgentTemplateKey as GraphqlAgentTemplateKey,
  AgentTemplateKind as GraphqlAgentTemplateKind,
  AgentTemplateLevel as GraphqlAgentTemplateLevel,
} from '@/platform/graphql-server/generated/schema.generated';

export const GRAPHQL_AGENT_TEMPLATE_KEY: Readonly<
  Record<AgentTemplateKey, GraphqlAgentTemplateKey>
> = {
  [AgentTemplateKey.CafeSupport]: GraphqlAgentTemplateKey.CafeSupport,
  [AgentTemplateKey.StoreSales]: GraphqlAgentTemplateKey.StoreSales,
  [AgentTemplateKey.FaqHandOff]: GraphqlAgentTemplateKey.FaqHandOff,
  [AgentTemplateKey.KnowledgeAnswers]: GraphqlAgentTemplateKey.KnowledgeAnswers,
  [AgentTemplateKey.MenuButtons]: GraphqlAgentTemplateKey.MenuButtons,
  [AgentTemplateKey.IntentRouter]: GraphqlAgentTemplateKey.IntentRouter,
  [AgentTemplateKey.LeadCapture]: GraphqlAgentTemplateKey.LeadCapture,
  [AgentTemplateKey.FollowUpOnSilence]: GraphqlAgentTemplateKey.FollowUpOnSilence,
  [AgentTemplateKey.ScheduledCheckIn]: GraphqlAgentTemplateKey.ScheduledCheckIn,
  [AgentTemplateKey.CloseChat]: GraphqlAgentTemplateKey.CloseChat,
  [AgentTemplateKey.GuardedReply]: GraphqlAgentTemplateKey.GuardedReply,
  [AgentTemplateKey.BackgroundReview]: GraphqlAgentTemplateKey.BackgroundReview,
};

export const GRAPHQL_AGENT_TEMPLATE_KIND: Readonly<
  Record<AgentTemplateKind, GraphqlAgentTemplateKind>
> = {
  [AgentTemplateKind.Template]: GraphqlAgentTemplateKind.Template,
  [AgentTemplateKind.Snippet]: GraphqlAgentTemplateKind.Snippet,
};

export const GRAPHQL_AGENT_TEMPLATE_CATEGORY: Readonly<
  Record<AgentTemplateCategory, GraphqlAgentTemplateCategory>
> = {
  [AgentTemplateCategory.Support]: GraphqlAgentTemplateCategory.Support,
  [AgentTemplateCategory.Sales]: GraphqlAgentTemplateCategory.Sales,
  [AgentTemplateCategory.Quality]: GraphqlAgentTemplateCategory.Quality,
  [AgentTemplateCategory.FollowUp]: GraphqlAgentTemplateCategory.FollowUp,
};

export const GRAPHQL_AGENT_TEMPLATE_LEVEL: Readonly<
  Record<AgentTemplateLevel, GraphqlAgentTemplateLevel>
> = {
  [AgentTemplateLevel.Starter]: GraphqlAgentTemplateLevel.Starter,
  [AgentTemplateLevel.Intermediate]: GraphqlAgentTemplateLevel.Intermediate,
  [AgentTemplateLevel.Advanced]: GraphqlAgentTemplateLevel.Advanced,
};

export const toGraphqlAgentTemplate = (template: AgentTemplateView): GraphqlAgentTemplate => ({
  key: GRAPHQL_AGENT_TEMPLATE_KEY[template.key],
  kind: GRAPHQL_AGENT_TEMPLATE_KIND[template.kind],
  category: GRAPHQL_AGENT_TEMPLATE_CATEGORY[template.category],
  level: GRAPHQL_AGENT_TEMPLATE_LEVEL[template.level],
  name: template.name,
  description: template.description,
  highlights: template.highlights,
  usesKnowledge: template.usesKnowledge,
  nodeTypes: template.nodeTypes,
});
