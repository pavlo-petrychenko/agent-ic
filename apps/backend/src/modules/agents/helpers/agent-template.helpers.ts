import type { Locale } from '@agent-ic/contracts';
import { AgentTemplateKnowledgeRole, agentTemplateNodeTypes } from '@agent-ic/flow';
import type { AgentTemplate, AgentTemplateKnowledgeBases } from '@agent-ic/flow';
import {
  TEMPLATE_PROMPT_FOLDER_NAME,
  TEMPLATE_PROMPT_NOTE,
} from '@/modules/agents/constants/agent-template.constants';
import type {
  AgentTemplateKnowledgeEntry,
  AgentTemplateView,
  CreatedTemplateKnowledgeBase,
  NewTemplateKnowledgeBase,
  TemplateKnowledgeChoice,
  TemplatePromptRequest,
} from '@/modules/agents/typedefs/agent-template.typedefs';

export const toAgentTemplateView = (
  template: AgentTemplate,
  locale: Locale,
): AgentTemplateView => ({
  key: template.key,
  kind: template.kind,
  category: template.category,
  level: template.level,
  name: template.name[locale],
  description: template.description[locale],
  highlights: template.highlights.map((highlight) => highlight[locale]),
  usesKnowledge: template.usesKnowledge,
  knowledgeRoles: template.knowledgeRoles.map(({ role, label }) => ({
    role,
    label: label[locale],
  })),
  nodeTypes: agentTemplateNodeTypes(template.key),
});

export const templatePromptRequest = (
  template: AgentTemplate,
  locale: Locale,
  authorId: string,
): TemplatePromptRequest => ({
  folderName: TEMPLATE_PROMPT_FOLDER_NAME[locale],
  note: TEMPLATE_PROMPT_NOTE[locale],
  authorId,
  prompts: template.prompts.map((prompt) => ({
    key: prompt.key,
    name: prompt.name[locale],
    text: prompt.text[locale],
  })),
});

export const mergeTemplateKnowledgeBases = (
  entries: readonly AgentTemplateKnowledgeEntry[],
): AgentTemplateKnowledgeBases => {
  const merged = new Map<AgentTemplateKnowledgeRole, Set<string>>();
  for (const { role, ids } of entries) {
    merged.set(role, new Set([...(merged.get(role) ?? []), ...ids]));
  }
  return Object.fromEntries([...merged].map(([role, ids]) => [role, [...ids]]));
};

export const templateKnowledgeBaseIds = (
  knowledgeBaseIds: readonly string[],
  knowledgeBases: AgentTemplateKnowledgeBases,
): readonly string[] => [
  ...new Set([...knowledgeBaseIds, ...Object.values(knowledgeBases).flatMap((ids) => ids ?? [])]),
];

export const requestedKnowledgeRoles = (
  knowledgeBases: AgentTemplateKnowledgeBases,
  newKnowledgeBases: readonly NewTemplateKnowledgeBase[],
): readonly string[] => [
  ...new Set([
    ...Object.keys(knowledgeBases),
    ...newKnowledgeBases.flatMap(({ role }) => (role === null ? [] : [role])),
  ]),
];

export const undeclaredKnowledgeRoles = (
  template: AgentTemplate,
  roles: readonly string[],
): readonly string[] => {
  const declared = new Set<string>(template.knowledgeRoles.map((spec) => spec.role));
  return roles.filter((role) => !declared.has(role));
};

export const withCreatedKnowledgeBases = (
  knowledgeBaseIds: readonly string[],
  knowledgeBases: AgentTemplateKnowledgeBases,
  created: readonly CreatedTemplateKnowledgeBase[],
): TemplateKnowledgeChoice => ({
  knowledgeBaseIds: [
    ...knowledgeBaseIds,
    ...created.flatMap(({ role, id }) => (role === null ? [id] : [])),
  ],
  knowledgeBases: mergeTemplateKnowledgeBases([
    ...Object.values(AgentTemplateKnowledgeRole).flatMap((role) =>
      created.some((entry) => entry.role === role) || knowledgeBases[role] === undefined
        ? []
        : [{ role, ids: knowledgeBases[role] }],
    ),
    ...created.flatMap(({ role, id }) => (role === null ? [] : [{ role, ids: [id] }])),
  ]),
});
