import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import {
  AGENT_TEMPLATE_KIND_ORDER,
  AGENT_TEMPLATE_LEVEL_ORDER,
  AgentTemplateKey,
  AgentTemplateKind,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentTemplate,
  agentTemplateNodeTypes,
  agentTemplates,
  agentTemplatesOfKind,
  agentTemplatesUsing,
  buildAgentTemplate,
} from '@flow/agent-templates/helpers/agent-template.helpers';
import type {
  AgentTemplate,
  AgentTemplatePrompt,
  LocalizedText,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { NODE_KEY_PATTERN } from '@flow/limits/constants/limit.constants';
import { ModelProviderKind } from '@flow/references/constants/reference.constants';
import { visibleVariables } from '@flow/scope/helpers/scope.helpers';
import { collectPromptVariables } from '@flow/templates/helpers/prompt.helpers';
import { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';
import { validateFlow } from '@flow/validation/helpers/validation.helpers';
import { parseFlow } from '@flow/versions/helpers/version.helpers';
import {
  builtTemplate,
  TEMPLATE_AGENT_MODEL,
  TEMPLATE_COMPLETION_MODEL,
  TEMPLATE_ID_PREFIX,
  TEMPLATE_KNOWLEDGE_BASE_IDS,
  TEMPLATE_LOCALES,
  TEMPLATE_TIME_ZONE,
  templateOptions,
  templatePromptRef,
} from '@test/support/fixtures/agent-template.fixture';

const PALETTE_NODE_TYPES: readonly NodeType[] = [
  NodeType.TriggerMessage,
  NodeType.TriggerSchedule,
  NodeType.TriggerInactivity,
  NodeType.Agent,
  NodeType.Completion,
  NodeType.Router,
  NodeType.Parallel,
  NodeType.SendMessage,
  NodeType.ApiRequest,
  NodeType.Escalation,
];

const MIN_HIGHLIGHTS = 2;
const MAX_HIGHLIGHTS = 3;
const MIN_TEMPLATE_PROMPT_SENTENCES = 8;
const MAX_TEMPLATE_PROMPT_SENTENCES = 15;
const SENTENCE_END = /(?<=[.!?])\s+/u;

const KEYS = agentTemplates.map((template) => template.key);

const keysOfKind = (kind: AgentTemplateKind): readonly AgentTemplateKey[] =>
  agentTemplatesOfKind(kind).map((template) => template.key);

const TEMPLATE_KEYS = keysOfKind(AgentTemplateKind.Template);
const SNIPPET_KEYS = keysOfKind(AgentTemplateKind.Snippet);

const CASES = KEYS.flatMap((key) => TEMPLATE_LOCALES.map((locale) => [key, locale] as const));

const llmSteps = (flow: FlowDocument) =>
  flow.nodes.flatMap((node) =>
    node.type === NodeType.Agent || node.type === NodeType.Completion ? [node] : [],
  );

const KNOWLEDGE_KEYS = agentTemplates
  .filter((template) => template.usesKnowledge)
  .map((template) => template.key);

const attachedKnowledgeBases = (flow: FlowDocument): readonly (readonly string[])[] =>
  flow.nodes.flatMap((node) =>
    node.type === NodeType.Agent ? [node.config.knowledgeBaseIds] : [],
  );

const nodeTypes = (flow: FlowDocument): ReadonlySet<NodeType> =>
  new Set(flow.nodes.map((node) => node.type));

const templateTexts = (key: AgentTemplateKey): readonly LocalizedText[] => {
  const template = agentTemplate(key);
  return [
    template.name,
    template.description,
    ...template.highlights,
    ...template.prompts.flatMap((prompt) => [prompt.name, prompt.text]),
  ];
};

const nodeStrings = (node: FlowNode): readonly string[] => [node.label];

const rank = (template: AgentTemplate): number =>
  AGENT_TEMPLATE_KIND_ORDER.indexOf(template.kind) * AGENT_TEMPLATE_LEVEL_ORDER.length +
  AGENT_TEMPLATE_LEVEL_ORDER.indexOf(template.level);

const ALL_PROMPTS: readonly AgentTemplatePrompt[] = agentTemplates.flatMap(
  (template) => template.prompts,
);

const promptOf = (promptRef: string | undefined): AgentTemplatePrompt | undefined =>
  ALL_PROMPTS.find((prompt) => templatePromptRef(prompt.key) === promptRef);

const variablesOf = (text: string): readonly string[] => [...collectPromptVariables(text)].sort();

const coveredTypes = (keys: readonly AgentTemplateKey[]): ReadonlySet<NodeType> =>
  new Set(keys.flatMap((key) => agentTemplateNodeTypes(key)));

describe('agentTemplates', () => {
  it('lists the templates first, then the snippets from starter to advanced', () => {
    expect(new Set(KEYS)).toEqual(new Set(Object.values(AgentTemplateKey)));
    expect(KEYS).toHaveLength(Object.values(AgentTemplateKey).length);
    const ranks = agentTemplates.map(rank);
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
    expect(KEYS.slice(0, TEMPLATE_KEYS.length)).toEqual(TEMPLATE_KEYS);
  });

  it('has two big templates and keeps the ten snippets', () => {
    expect(TEMPLATE_KEYS).toEqual([AgentTemplateKey.CafeSupport, AgentTemplateKey.StoreSales]);
    expect(SNIPPET_KEYS).toHaveLength(KEYS.length - TEMPLATE_KEYS.length);
    expect([...TEMPLATE_KEYS, ...SNIPPET_KEYS]).toEqual(KEYS);
  });

  it('uses unique snake_case keys across both kinds', () => {
    expect(new Set(KEYS).size).toBe(KEYS.length);
    for (const key of KEYS) {
      expect(NODE_KEY_PATTERN.test(key)).toBe(true);
    }
  });

  it('gives the same metadata through agentTemplate', () => {
    for (const template of agentTemplates) {
      expect(agentTemplate(template.key)).toEqual(template);
      expect(agentTemplate(template.key)).not.toHaveProperty('draft');
    }
  });

  it.each(KEYS)('%s has non-empty text in every locale', (key) => {
    for (const text of templateTexts(key)) {
      for (const locale of Object.values(Locale)) {
        expect(text[locale].trim()).not.toBe('');
      }
    }
  });

  it.each(KEYS)('%s has two or three highlights', (key) => {
    const { highlights } = agentTemplate(key);
    expect(highlights.length).toBeGreaterThanOrEqual(MIN_HIGHLIGHTS);
    expect(highlights.length).toBeLessThanOrEqual(MAX_HIGHLIGHTS);
  });

  it('gives one prompt definition per prompt key across templates and snippets', () => {
    const byKey = new Map(ALL_PROMPTS.map((prompt) => [prompt.key, prompt]));
    for (const prompt of ALL_PROMPTS) {
      expect(byKey.get(prompt.key)).toEqual(prompt);
    }
    for (const locale of Object.values(Locale)) {
      const names = [...byKey.values()].map((prompt) => prompt.name[locale]);
      expect(new Set(names).size).toBe(names.length);
    }
  });

  it('declares the same prompt variables in every locale', () => {
    for (const prompt of ALL_PROMPTS) {
      const [first, ...others] = Object.values(Locale).map((locale) =>
        variablesOf(prompt.text[locale]),
      );
      for (const variables of others) {
        expect(variables).toEqual(first);
      }
    }
  });

  it.each(TEMPLATE_KEYS)('%s gives detailed prompts of 8 to 15 sentences', (key) => {
    for (const prompt of agentTemplate(key).prompts) {
      for (const locale of Object.values(Locale)) {
        const sentences = prompt.text[locale].split(SENTENCE_END).length;
        expect(sentences).toBeGreaterThanOrEqual(MIN_TEMPLATE_PROMPT_SENTENCES);
        expect(sentences).toBeLessThanOrEqual(MAX_TEMPLATE_PROMPT_SENTENCES);
      }
    }
  });
});

describe('buildAgentTemplate', () => {
  it.each(CASES)('%s (%s) parses and validates without any issue', (key, locale) => {
    const flow = builtTemplate(key, locale);

    expect(parseFlow(flow).ok).toBe(true);
    expect(validateFlow(flow)).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no blocking issue without prompts or knowledge', (key, locale) => {
    const flow = buildAgentTemplate(key, {
      ...templateOptions(key, locale),
      promptRefs: {},
      knowledgeBaseIds: [],
    });

    const blocking = validateFlow(flow).filter(
      (issue) => issue.severity === FlowIssueSeverity.Error,
    );
    expect(new Set(blocking.map((issue) => issue.code))).toEqual(
      llmSteps(flow).length === 0 ? new Set() : new Set([FlowIssueCode.MissingPrompt]),
    );
  });

  it.each(CASES)('%s (%s) uses exactly the prompts it declares', (key, locale) => {
    const flow = builtTemplate(key, locale);
    const declared = agentTemplate(key).prompts.map((prompt) => templatePromptRef(prompt.key));

    const used = llmSteps(flow).map((node) => node.config.prompt?.promptRef ?? null);

    expect(used).not.toContain(null);
    expect(new Set(used)).toEqual(new Set(declared));
  });

  it.each(CASES)('%s (%s) binds every prompt variable to a visible variable', (key, locale) => {
    const flow = builtTemplate(key, locale);

    for (const node of llmSteps(flow)) {
      const prompt = promptOf(node.config.prompt?.promptRef);
      const bindings = node.config.prompt?.bindings ?? {};
      const visible = new Set(visibleVariables(flow, node.id).map((variable) => variable.path));

      expect(Object.keys(bindings).sort()).toEqual(variablesOf(prompt?.text[locale] ?? ''));
      for (const target of Object.values(bindings)) {
        expect(visible.has(target)).toBe(true);
      }
    }
  });

  it.each(CASES)('%s (%s) takes every node and edge id from nextId', (key, locale) => {
    const flow = builtTemplate(key, locale);
    const ids = [...flow.nodes.map((node) => node.id), ...flow.edges.map((edge) => edge.id)];

    expect(new Set(ids).size).toBe(ids.length);
    for (const value of ids) {
      expect(value.startsWith(TEMPLATE_ID_PREFIX)).toBe(true);
    }
  });

  it.each(KEYS)('%s keeps the same snake_case keys in every locale', (key) => {
    const [first, ...others] = TEMPLATE_LOCALES.map((locale) =>
      builtTemplate(key, locale).nodes.map((node) => node.key),
    );

    expect(new Set(first).size).toBe(first?.length);
    for (const nodeKey of first ?? []) {
      expect(NODE_KEY_PATTERN.test(nodeKey)).toBe(true);
    }
    for (const keys of others) {
      expect(keys).toEqual(first);
    }
  });

  it.each(KEYS)('%s writes its labels in the chosen locale', (key) => {
    const english = builtTemplate(key, Locale.En).nodes.flatMap(nodeStrings);
    const ukrainian = builtTemplate(key, Locale.Uk).nodes.flatMap(nodeStrings);

    for (const label of [...english, ...ukrainian]) {
      expect(label.trim()).not.toBe('');
    }
    expect(ukrainian.filter((label, index) => label === english[index])).toEqual([]);
  });

  it.each(KNOWLEDGE_KEYS)('%s attaches the given knowledge bases', (key) => {
    expect(attachedKnowledgeBases(builtTemplate(key))).toContainEqual(TEMPLATE_KNOWLEDGE_BASE_IDS);
  });

  it.each(KEYS.filter((key) => !KNOWLEDGE_KEYS.includes(key)))(
    '%s attaches no knowledge base',
    (key) => {
      expect(attachedKnowledgeBases(builtTemplate(key)).flat()).toEqual([]);
    },
  );

  it.each(TEMPLATE_KEYS)('%s uses the knowledge bases', (key) => {
    expect(KNOWLEDGE_KEYS).toContain(key);
  });

  it.each(TEMPLATE_KEYS)('%s sets the default hand-off, failure hand-off and auto-close', (key) => {
    const { settings } = builtTemplate(key);

    expect(settings.handoff).not.toBeNull();
    expect(settings.onUnhandledFailure).not.toBeNull();
    expect(settings.autoClose).not.toBeNull();
  });

  it.each(KEYS)('%s runs every AI step on the given platform models', (key) => {
    for (const node of llmSteps(builtTemplate(key))) {
      expect(node.config.model).toEqual({
        provider: { kind: ModelProviderKind.Platform },
        model: node.type === NodeType.Agent ? TEMPLATE_AGENT_MODEL : TEMPLATE_COMPLETION_MODEL,
      });
    }
  });

  it('runs the schedule in the given time zone', () => {
    const schedules = KEYS.flatMap((key) => builtTemplate(key).nodes).flatMap((node) =>
      node.type === NodeType.TriggerSchedule ? [node.config.schedule.timeZone] : [],
    );

    expect(schedules).not.toEqual([]);
    expect(new Set(schedules)).toEqual(new Set([TEMPLATE_TIME_ZONE]));
  });
});

describe('agentTemplateNodeTypes and agentTemplatesUsing', () => {
  it.each([
    [AgentTemplateKind.Template, TEMPLATE_KEYS],
    [AgentTemplateKind.Snippet, SNIPPET_KEYS],
  ])('the %s kind covers every palette node type', (_kind, keys) => {
    const covered = coveredTypes(keys);

    for (const type of PALETTE_NODE_TYPES) {
      expect(covered.has(type)).toBe(true);
    }
    expect(covered.has(NodeType.TriggerExternalEvent)).toBe(false);
  });

  it.each(KEYS)('%s lists its node types in palette order', (key) => {
    const used = nodeTypes(builtTemplate(key));

    expect(agentTemplateNodeTypes(key)).toEqual(
      PALETTE_NODE_TYPES.filter((type) => used.has(type)),
    );
  });

  it.each(Object.values(NodeType))('lists the templates and snippets that use %s', (type) => {
    expect(agentTemplatesUsing(type)).toEqual(
      KEYS.filter((key) => nodeTypes(builtTemplate(key)).has(type)),
    );
  });
});
