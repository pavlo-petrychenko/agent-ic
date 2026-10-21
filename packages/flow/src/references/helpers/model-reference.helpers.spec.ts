import { describe, expect, it } from 'vitest';
import { FLOW_SCHEMA_VERSION, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, ModelRef } from '@flow/document/typedefs/flow.typedefs';
import { ModelProviderKind } from '@flow/references/constants/reference.constants';
import { modelReferences } from '@flow/references/helpers/model-reference.helpers';
import {
  agent,
  completion,
  field,
  link,
  messageTrigger,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const KEY_ID = 'lmk_vendor';
const KEY_MODEL = 'gpt-4.1-mini';
const PLATFORM_MODEL = 'claude-sonnet';
const AGENT_LABEL = 'Receptionist';

const workspaceModel: ModelRef = {
  provider: { kind: ModelProviderKind.Workspace, providerKeyId: KEY_ID },
  model: KEY_MODEL,
};

const platformModel: ModelRef = {
  provider: { kind: ModelProviderKind.Platform },
  model: PLATFORM_MODEL,
};

describe('modelReferences', () => {
  it('lists the chosen model of every Agent and Completion step', () => {
    const trigger = messageTrigger('incoming');
    const bare = agent('bare');
    const keyed = {
      ...bare,
      id: 'n_keyed',
      key: 'keyed',
      label: AGENT_LABEL,
      config: { ...bare.config, model: workspaceModel },
    };
    const unset = { ...bare, config: { ...bare.config, model: null } };
    const judge = completion('judge', [field('verdict')]);
    const platform = { ...judge, config: { ...judge.config, model: platformModel } };
    const reply = sendText('reply', 'Hello');
    const flow: FlowDocument = {
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [trigger, unset, keyed, platform, reply],
      edges: [
        link(trigger, PortName.Next, unset),
        link(unset, PortName.Next, keyed),
        link(keyed, PortName.Next, platform),
        link(platform, PortName.Next, reply),
      ],
    };

    expect(modelReferences(flow)).toEqual([
      {
        nodeId: keyed.id,
        nodeKey: keyed.key,
        nodeLabel: AGENT_LABEL,
        provider: workspaceModel.provider,
        model: KEY_MODEL,
      },
      {
        nodeId: platform.id,
        nodeKey: platform.key,
        nodeLabel: platform.label,
        provider: platformModel.provider,
        model: PLATFORM_MODEL,
      },
    ]);
  });

  it('lists nothing for steps without a model', () => {
    const trigger = messageTrigger('incoming');
    const bare = agent('bare');
    const unset = { ...bare, config: { ...bare.config, model: null } };
    const flow: FlowDocument = {
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [trigger, unset],
      edges: [link(trigger, PortName.Next, unset)],
    };

    expect(modelReferences(flow)).toEqual([]);
  });
});
