import { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import {
  AGENT_EXAMPLE_LEVEL_ORDER,
  AgentExampleId,
} from '@flow/examples/constants/agent-example.constants';
import {
  agentExample,
  agentExampleNodeTypes,
  agentExamples,
  agentExamplesUsing,
  buildAgentExample,
} from '@flow/examples/helpers/agent-example.helpers';
import type { LocalizedText } from '@flow/examples/typedefs/agent-example.typedefs';
import { NODE_KEY_PATTERN } from '@flow/limits/constants/limit.constants';
import { ModelProviderKind } from '@flow/references/constants/reference.constants';
import { collectPromptVariables } from '@flow/templates/helpers/prompt.helpers';
import { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';
import { validateFlow } from '@flow/validation/helpers/validation.helpers';
import { parseFlow } from '@flow/versions/helpers/version.helpers';
import {
  builtExample,
  EXAMPLE_AGENT_MODEL,
  EXAMPLE_COMPLETION_MODEL,
  EXAMPLE_ID_PREFIX,
  EXAMPLE_KNOWLEDGE_BASE_IDS,
  EXAMPLE_LOCALES,
  EXAMPLE_TIME_ZONE,
  exampleOptions,
  examplePromptRef,
} from '@test/support/fixtures/agent-example.fixture';

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

const IDS = agentExamples.map((example) => example.id);

const CASES = IDS.flatMap((id) => EXAMPLE_LOCALES.map((locale) => [id, locale] as const));

const llmSteps = (flow: FlowDocument) =>
  flow.nodes.flatMap((node) =>
    node.type === NodeType.Agent || node.type === NodeType.Completion ? [node] : [],
  );

const KNOWLEDGE_IDS = agentExamples
  .filter((example) => example.usesKnowledge)
  .map((example) => example.id);

const attachedKnowledgeBases = (flow: FlowDocument): readonly (readonly string[])[] =>
  flow.nodes.flatMap((node) =>
    node.type === NodeType.Agent ? [node.config.knowledgeBaseIds] : [],
  );

const nodeTypes = (flow: FlowDocument): ReadonlySet<NodeType> =>
  new Set(flow.nodes.map((node) => node.type));

const exampleTexts = (id: AgentExampleId): readonly LocalizedText[] => {
  const example = agentExample(id);
  return [
    example.name,
    example.description,
    ...example.highlights,
    ...example.prompts.flatMap((prompt) => [prompt.name, prompt.text]),
  ];
};

const nodeStrings = (node: FlowNode): readonly string[] => [node.label];

describe('agentExamples', () => {
  it('lists every example once, from starter to advanced', () => {
    expect(new Set(IDS)).toEqual(new Set(Object.values(AgentExampleId)));
    expect(IDS).toHaveLength(Object.values(AgentExampleId).length);
    const ranks = agentExamples.map((example) => AGENT_EXAMPLE_LEVEL_ORDER.indexOf(example.level));
    expect(ranks).toEqual([...ranks].sort((a, b) => a - b));
  });

  it('gives the same metadata through agentExample', () => {
    for (const example of agentExamples) {
      expect(agentExample(example.id)).toEqual(example);
      expect(agentExample(example.id)).not.toHaveProperty('draft');
    }
  });

  it.each(IDS)('%s has non-empty text in every locale', (id) => {
    for (const text of exampleTexts(id)) {
      for (const locale of Object.values(Locale)) {
        expect(text[locale].trim()).not.toBe('');
      }
    }
  });

  it.each(IDS)('%s has two or three highlights', (id) => {
    const { highlights } = agentExample(id);
    expect(highlights.length).toBeGreaterThanOrEqual(MIN_HIGHLIGHTS);
    expect(highlights.length).toBeLessThanOrEqual(MAX_HIGHLIGHTS);
  });

  it('gives one prompt definition per prompt key across the catalog', () => {
    const prompts = agentExamples.flatMap((example) => example.prompts);
    const byKey = new Map(prompts.map((prompt) => [prompt.key, prompt]));
    for (const prompt of prompts) {
      expect(byKey.get(prompt.key)).toEqual(prompt);
    }
    const names = [...byKey.values()].map((prompt) => prompt.name.en);
    expect(new Set(names).size).toBe(names.length);
  });

  it('declares no prompt variables, so no binding is needed', () => {
    const variables = agentExamples
      .flatMap((example) => example.prompts)
      .flatMap((prompt) => Object.values(Locale).map((locale) => prompt.text[locale]))
      .flatMap((text) => collectPromptVariables(text));
    expect(variables).toEqual([]);
  });
});

describe('buildAgentExample', () => {
  it.each(CASES)('%s (%s) parses and validates without any issue', (id, locale) => {
    const flow = builtExample(id, locale);

    expect(parseFlow(flow).ok).toBe(true);
    expect(validateFlow(flow)).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no blocking issue without prompts or knowledge', (id, locale) => {
    const flow = buildAgentExample(id, {
      ...exampleOptions(id, locale),
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

  it.each(CASES)('%s (%s) uses exactly the prompts it declares', (id, locale) => {
    const flow = builtExample(id, locale);
    const declared = agentExample(id).prompts.map((prompt) => examplePromptRef(prompt.key));

    const used = llmSteps(flow).map((node) => node.config.prompt?.promptRef ?? null);

    expect(used).not.toContain(null);
    expect(new Set(used)).toEqual(new Set(declared));
    for (const node of llmSteps(flow)) {
      expect(node.config.prompt?.bindings).toEqual({});
    }
  });

  it.each(CASES)('%s (%s) takes every node and edge id from nextId', (id, locale) => {
    const flow = builtExample(id, locale);
    const ids = [...flow.nodes.map((node) => node.id), ...flow.edges.map((edge) => edge.id)];

    expect(new Set(ids).size).toBe(ids.length);
    for (const value of ids) {
      expect(value.startsWith(EXAMPLE_ID_PREFIX)).toBe(true);
    }
  });

  it.each(IDS)('%s keeps the same snake_case keys in every locale', (id) => {
    const [first, ...others] = EXAMPLE_LOCALES.map((locale) =>
      builtExample(id, locale).nodes.map((node) => node.key),
    );

    expect(new Set(first).size).toBe(first?.length);
    for (const key of first ?? []) {
      expect(NODE_KEY_PATTERN.test(key)).toBe(true);
    }
    for (const keys of others) {
      expect(keys).toEqual(first);
    }
  });

  it.each(IDS)('%s writes its labels in the chosen locale', (id) => {
    const english = builtExample(id, Locale.En).nodes.flatMap(nodeStrings);
    const ukrainian = builtExample(id, Locale.Uk).nodes.flatMap(nodeStrings);

    for (const label of [...english, ...ukrainian]) {
      expect(label.trim()).not.toBe('');
    }
    expect(ukrainian.filter((label, index) => label === english[index])).toEqual([]);
  });

  it.each(KNOWLEDGE_IDS)('%s attaches the given knowledge bases', (id) => {
    expect(attachedKnowledgeBases(builtExample(id))).toContainEqual(EXAMPLE_KNOWLEDGE_BASE_IDS);
  });

  it.each(IDS.filter((id) => !KNOWLEDGE_IDS.includes(id)))(
    '%s attaches no knowledge base',
    (id) => {
      expect(attachedKnowledgeBases(builtExample(id)).flat()).toEqual([]);
    },
  );

  it.each(IDS)('%s runs every AI step on the given platform models', (id) => {
    for (const node of llmSteps(builtExample(id))) {
      expect(node.config.model).toEqual({
        provider: { kind: ModelProviderKind.Platform },
        model: node.type === NodeType.Agent ? EXAMPLE_AGENT_MODEL : EXAMPLE_COMPLETION_MODEL,
      });
    }
  });

  it('runs the schedule in the given time zone', () => {
    const schedules = IDS.flatMap((id) => builtExample(id).nodes).flatMap((node) =>
      node.type === NodeType.TriggerSchedule ? [node.config.schedule.timeZone] : [],
    );

    expect(schedules).not.toEqual([]);
    expect(new Set(schedules)).toEqual(new Set([EXAMPLE_TIME_ZONE]));
  });
});

describe('agentExampleNodeTypes and agentExamplesUsing', () => {
  it('cover every palette node type across the catalog', () => {
    const covered = new Set(IDS.flatMap((id) => agentExampleNodeTypes(id)));

    for (const type of PALETTE_NODE_TYPES) {
      expect(covered.has(type)).toBe(true);
    }
    expect(covered.has(NodeType.TriggerExternalEvent)).toBe(false);
  });

  it.each(IDS)('%s lists its node types in palette order', (id) => {
    const used = nodeTypes(builtExample(id));

    expect(agentExampleNodeTypes(id)).toEqual(PALETTE_NODE_TYPES.filter((type) => used.has(type)));
  });

  it.each(Object.values(NodeType))('lists the examples that use %s', (type) => {
    expect(agentExamplesUsing(type)).toEqual(
      IDS.filter((id) => nodeTypes(builtExample(id)).has(type)),
    );
  });
});
