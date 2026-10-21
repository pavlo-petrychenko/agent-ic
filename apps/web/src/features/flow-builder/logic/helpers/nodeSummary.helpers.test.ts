import {
  ModelProviderKind,
  NodeType,
  PortName,
  PromptSourceKind,
  PromptVersionKind,
  RuleMatch,
} from '@agent-ic/flow';
import type { FlowNode, ModelRef, PromptSource } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { SummaryKey } from '@/features/flow-builder/constants/nodeSummary.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { nodeSummary, portLabel } from '@/features/flow-builder/logic/helpers/nodeSummary.helpers';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';
import type { ModelChoice } from '@/features/flow-builder/typedefs/llmStep.typedefs';
import { ModelSource, ModelVendor } from '@/shared/api/generated/schema.generated';

const stepOf = (type: AddableNodeType): FlowNode => {
  const [node] = addNode(EMPTY_FLOW, type, { x: 0, y: 0 }, 'n').nodes;
  if (node === undefined) {
    throw new Error('no node');
  }
  return node;
};

const keys = (type: AddableNodeType) => nodeSummary(stepOf(type), []).map((part) => part.key);

const HAIKU: ModelChoice = {
  id: 'claude-haiku-5-5',
  label: 'Claude Haiku 5.5',
  vendor: ModelVendor.Anthropic,
  source: ModelSource.Platform,
  providerKeyId: null,
  purposes: [],
  reasoningLevels: [],
  defaultReasoningLevel: null,
  inputPrice: 1,
  outputPrice: 5,
};

const platform = (model: string): ModelRef => ({
  provider: { kind: ModelProviderKind.Platform },
  model,
});

const agentWith = (model: string | ModelRef, prompt: PromptSource | null = null): FlowNode => {
  const agent = stepOf(NodeType.Agent);
  return agent.type === NodeType.Agent
    ? {
        ...agent,
        config: {
          ...agent.config,
          prompt,
          model: typeof model === 'string' ? platform(model) : model,
        },
      }
    : agent;
};

describe('nodeSummary', () => {
  it('describes each new step from its config', () => {
    expect(keys(NodeType.TriggerMessage)).toEqual([SummaryKey.AllChannels]);
    expect(keys(NodeType.Agent)).toEqual([SummaryKey.NoModel]);
    expect(keys(NodeType.SendMessage)).toEqual([SummaryKey.Text]);
    expect(keys(NodeType.Escalation)).toEqual([SummaryKey.NotifyTeam]);
    expect(keys(NodeType.Router)).toEqual([]);
    expect(nodeSummary(stepOf(NodeType.Completion), [])).toEqual([
      { key: SummaryKey.Outputs, params: { fields: 'result' } },
    ]);
    expect(nodeSummary(stepOf(NodeType.ApiRequest), [])).toEqual([
      { key: SummaryKey.Request, params: { method: 'GET', url: '' } },
    ]);
  });

  it('names the model by its label and falls back to the id of an unlisted one', () => {
    expect(nodeSummary(agentWith(HAIKU.id), [HAIKU])).toEqual([
      { key: SummaryKey.Model, params: { model: HAIKU.label } },
    ]);
    expect(nodeSummary(agentWith('retired-model'), [HAIKU])[0]).toEqual({
      key: SummaryKey.Model,
      params: { model: 'retired-model' },
    });
  });

  it('names a model of a workspace key by its id', () => {
    const own: ModelRef = {
      provider: { kind: ModelProviderKind.Workspace, providerKeyId: 'lmk_01own' },
      model: HAIKU.id,
    };

    expect(nodeSummary(agentWith(own), [HAIKU])[0]).toEqual({
      key: SummaryKey.Model,
      params: { model: HAIKU.id },
    });
  });

  it('marks a step that uses a library prompt', () => {
    expect(
      nodeSummary(
        agentWith(HAIKU.id, {
          kind: PromptSourceKind.Library,
          promptRef: 'prm_receptionist',
          pin: { kind: PromptVersionKind.Latest },
        }),
        [HAIKU],
      ),
    ).toEqual([
      { key: SummaryKey.Model, params: { model: HAIKU.label } },
      { key: SummaryKey.LibraryPrompt, params: {} },
    ]);
  });
});

describe('portLabel', () => {
  it('labels router rules by name and the fixed ports by kind', () => {
    const router = stepOf(NodeType.Router);
    const rules = [
      { id: 'r1', label: 'needs_human', match: RuleMatch.All, conditions: [] },
      { id: 'r2', label: '', match: RuleMatch.All, conditions: [] },
    ];
    const withRules: FlowNode =
      router.type === NodeType.Router ? { ...router, config: { rules } } : router;

    expect(portLabel(withRules, 'r1')).toEqual({ rule: 'needs_human' });
    expect(portLabel(withRules, 'r2')).toBeNull();
    expect(portLabel(withRules, PortName.Else)).toEqual({ port: PortName.Else });
    expect(portLabel(stepOf(NodeType.Agent), PortName.Next)).toBeNull();
  });
});
