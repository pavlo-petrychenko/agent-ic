import { ReasoningLevel } from '@agent-ic/contracts';
import { ModelProviderKind, NodeType, OutputFieldType, PortName } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import {
  NEW_ENUM_VALUE,
  PLATFORM_CHOICE_SOURCE,
} from '@/features/flow-builder/constants/llmStep.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  addOutputField,
  modelsForStep,
  removeOutputField,
  selectModel,
  setIncludeCurrentMessage,
  setRetries,
  updateLlmStep,
  updateOutputField,
} from '@/features/flow-builder/logic/helpers/llmStep.helpers';
import { choiceKey } from '@/features/flow-builder/logic/helpers/modelChoice.helpers';
import type { ModelChoice, ModelGroup } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { ModelPurpose, ModelSource, ModelVendor } from '@/shared/api/generated/schema.generated';

const ORIGIN = { x: 0, y: 0 };
const model = (id: string, purposes: ModelPurpose[], levels: ReasoningLevel[]): ModelChoice => ({
  id,
  label: id,
  vendor: ModelVendor.Openai,
  source: ModelSource.Platform,
  providerKeyId: null,
  purposes,
  reasoningLevels: levels,
  defaultReasoningLevel: null,
  inputPrice: 1,
  outputPrice: 2,
});
const STRONG = model('strong', [ModelPurpose.Conversation], [ReasoningLevel.High]);
const FAST = model('fast', [ModelPurpose.Light], []);
const KEY_ID = 'lmk_01own';
const OWN: ModelChoice = {
  ...model('gpt-4o', [ModelPurpose.Conversation, ModelPurpose.Light], []),
  vendor: null,
  source: ModelSource.Workspace,
  providerKeyId: KEY_ID,
  inputPrice: null,
  outputPrice: null,
};
const group = (id: string, choices: readonly ModelChoice[]): ModelGroup => ({
  id,
  label: id,
  choices,
  loading: false,
  failed: false,
  retry: () => undefined,
});
const GROUPS = [group(PLATFORM_CHOICE_SOURCE, [STRONG, FAST]), group(KEY_ID, [OWN])];
const platformKey = (id: string) => choiceKey({ providerKeyId: null, model: id });

const flow = (): FlowDocument => {
  const document = addNode(
    addNode(EMPTY_FLOW, NodeType.Agent, ORIGIN, 'a'),
    NodeType.Completion,
    ORIGIN,
    'c',
  );
  return {
    ...document,
    edges: [
      { id: 'next', source: 'c', sourcePort: PortName.Next, target: 'a' },
      { id: 'error', source: 'c', sourcePort: PortName.Error, target: 'a' },
    ],
  };
};
const config = (document: FlowDocument, id: string) =>
  document.nodes.find((node) => node.id === id)?.config;

describe('llm step helpers', () => {
  it('offers the platform models made for the step type and key models to both', () => {
    const choices = (type: NodeType.Agent | NodeType.Completion) =>
      modelsForStep(GROUPS, type).map((entry) => entry.choices);

    expect(choices(NodeType.Agent)).toEqual([[STRONG], [OWN]]);
    expect(choices(NodeType.Completion)).toEqual([[FAST], [OWN]]);
  });

  it('keeps the reasoning level only while the new model supports it', () => {
    const strong = updateLlmStep(selectModel(flow(), 'a', GROUPS, platformKey('strong')), 'a', {
      reasoning: ReasoningLevel.High,
    });

    expect(config(strong, 'a')).toMatchObject({
      model: { provider: { kind: ModelProviderKind.Platform }, model: 'strong' },
      reasoning: 'high',
    });
    expect(config(selectModel(strong, 'a', GROUPS, platformKey('fast')), 'a')).toMatchObject({
      model: { model: 'fast' },
      reasoning: null,
    });
    expect(selectModel(strong, 'a', GROUPS, platformKey('gone'))).toBe(strong);
  });

  it('stores a key model and a typed id as a workspace model', () => {
    const workspace = { kind: ModelProviderKind.Workspace, providerKeyId: KEY_ID };
    const listed = selectModel(
      flow(),
      'a',
      GROUPS,
      choiceKey({ providerKeyId: KEY_ID, model: 'gpt-4o' }),
    );
    const typed = selectModel(
      flow(),
      'a',
      GROUPS,
      choiceKey({ providerKeyId: KEY_ID, model: 'o3' }),
    );

    expect(config(listed, 'a')).toMatchObject({ model: { provider: workspace, model: 'gpt-4o' } });
    expect(config(typed, 'a')).toMatchObject({ model: { provider: workspace, model: 'o3' } });
    const unknownKey = choiceKey({ providerKeyId: 'lmk_gone', model: 'o3' });
    expect(selectModel(flow(), 'a', GROUPS, unknownKey)).toEqual(flow());
  });

  it('adds, edits and removes output fields with unique names', () => {
    const added = addOutputField(addOutputField(flow(), 'a'), 'a');
    const edited = updateOutputField(added, 'a', 1, { type: OutputFieldType.Enum });

    expect(config(added, 'a')).toMatchObject({
      output: [{ name: 'field_1' }, { name: 'field_2' }],
    });
    expect(config(edited, 'a')).toMatchObject({
      output: [{}, { name: 'field_2', type: OutputFieldType.Enum, values: [NEW_ENUM_VALUE] }],
    });
    expect(
      config(updateOutputField(edited, 'a', 1, { name: 'tone', values: ['calm'] }), 'a'),
    ).toMatchObject({ output: [{}, { name: 'tone', values: ['calm'] }] });
    expect(config(removeOutputField(edited, 'a', 0), 'a')).toMatchObject({
      output: [{ name: 'field_2' }],
    });
  });

  it('sets retries and the current message input', () => {
    expect(config(setRetries(flow(), 'a', 4), 'a')).toMatchObject({ retries: 4 });
    expect(config(setIncludeCurrentMessage(flow(), 'c', false), 'c')).toMatchObject({
      input: { includeCurrentMessage: false },
    });
  });
});
