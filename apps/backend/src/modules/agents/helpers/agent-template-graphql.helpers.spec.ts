import {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  GRAPHQL_AGENT_TEMPLATE_CATEGORY,
  GRAPHQL_AGENT_TEMPLATE_KEY,
  GRAPHQL_AGENT_TEMPLATE_KIND,
  GRAPHQL_AGENT_TEMPLATE_LEVEL,
} from '@/modules/agents/helpers/agent-template-graphql.helpers';
import {
  AgentTemplateCategory as GraphqlAgentTemplateCategory,
  AgentTemplateKey as GraphqlAgentTemplateKey,
  AgentTemplateKind as GraphqlAgentTemplateKind,
  AgentTemplateLevel as GraphqlAgentTemplateLevel,
} from '@/platform/graphql-server/generated/schema.generated';

const sortedValues = (values: Readonly<Record<string, string>>): string[] =>
  Object.values(values).toSorted();

describe('agent template GraphQL enums', () => {
  it.each([
    ['AgentTemplateKey', AgentTemplateKey, GraphqlAgentTemplateKey],
    ['AgentTemplateKind', AgentTemplateKind, GraphqlAgentTemplateKind],
    ['AgentTemplateCategory', AgentTemplateCategory, GraphqlAgentTemplateCategory],
    ['AgentTemplateLevel', AgentTemplateLevel, GraphqlAgentTemplateLevel],
  ])('gives %s the same values as the flow package', (_name, domain, graphql) => {
    expect(sortedValues(graphql)).toEqual(sortedValues(domain));
  });

  it.each([
    ['AgentTemplateKey', GRAPHQL_AGENT_TEMPLATE_KEY],
    ['AgentTemplateKind', GRAPHQL_AGENT_TEMPLATE_KIND],
    ['AgentTemplateCategory', GRAPHQL_AGENT_TEMPLATE_CATEGORY],
    ['AgentTemplateLevel', GRAPHQL_AGENT_TEMPLATE_LEVEL],
  ])('maps each %s value to the GraphQL value with the same text', (_name, mapping) => {
    expect(Object.entries(mapping).filter(([domain, graphql]) => domain !== graphql)).toEqual([]);
  });
});
