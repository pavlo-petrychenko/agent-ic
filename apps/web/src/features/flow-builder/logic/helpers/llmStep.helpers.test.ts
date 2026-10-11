import { ReasoningLevel } from '@agent-ic/contracts';
import { NodeType, OutputFieldType } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { NEW_ENUM_VALUE } from '@/features/flow-builder/constants/llmStep.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  addOutputField,
  modelsForStep,
  removeOutputField,
  selectModel,
  updateLlmStep,
  updateOutputField,
} from '@/features/flow-builder/logic/helpers/llmStep.helpers';
import type { ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { ModelPurpose, ModelVendor } from '@/shared/api/generated/schema.generated';

const ORIGIN = { x: 0, y: 0 };
const model = (id: string, purposes: ModelPurpose[], levels: ReasoningLevel[]): ModelChoice => ({
  id,
  label: id,
  vendor: ModelVendor.Openai,
  purposes,
  reasoningLevels: levels,
  defaultReasoningLevel: null,
  inputPrice: 1,
  outputPrice: 2,
});
const STRONG = model('strong', [ModelPurpose.Conversation], [ReasoningLevel.High]);
const FAST = model('fast', [ModelPurpose.Light], []);
const MODELS = [STRONG, FAST];

const flow = (): FlowDocument =>
  addNode(addNode(EMPTY_FLOW, NodeType.Agent, ORIGIN, 'a'), NodeType.Completion, ORIGIN, 'c');
const config = (document: FlowDocument, id: string) =>
  document.nodes.find((node) => node.id === id)?.config;

describe('llm step helpers', () => {
  it('offers the models made for the step type', () => {
    expect(modelsForStep(MODELS, NodeType.Agent)).toEqual([STRONG]);
    expect(modelsForStep(MODELS, NodeType.Completion)).toEqual([FAST]);
  });

  it('keeps the reasoning level only while the new model supports it', () => {
    const strong = updateLlmStep(selectModel(flow(), 'a', MODELS, 'strong'), 'a', {
      reasoning: ReasoningLevel.High,
    });

    expect(config(strong, 'a')).toMatchObject({ model: { model: 'strong' }, reasoning: 'high' });
    expect(config(selectModel(strong, 'a', MODELS, 'fast'), 'a')).toMatchObject({
      model: { model: 'fast' },
      reasoning: null,
    });
    expect(selectModel(strong, 'a', MODELS, 'gone')).toBe(strong);
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
});
