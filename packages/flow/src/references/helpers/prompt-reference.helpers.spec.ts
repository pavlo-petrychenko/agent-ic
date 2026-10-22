import { describe, expect, it } from 'vitest';
import { FLOW_SCHEMA_VERSION, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, PromptSource } from '@flow/document/typedefs/flow.typedefs';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { promptReferences } from '@flow/references/helpers/prompt-reference.helpers';
import {
  agent,
  completion,
  field,
  link,
  messageTrigger,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const PINNED_REF = 'prm_pinned';
const PINNED_NUMBER = 2;
const PINNED_LABEL = 'Receptionist';
const LATEST_REF = 'prm_latest';

const library = (promptRef: string, number: number | null = null): PromptSource =>
  number === null
    ? {
        kind: PromptSourceKind.Library,
        promptRef,
        pin: { kind: PromptVersionKind.Latest },
        bindings: {},
      }
    : {
        kind: PromptSourceKind.Library,
        promptRef,
        pin: { kind: PromptVersionKind.Pinned, number },
        bindings: {},
      };

describe('promptReferences', () => {
  it('lists the library prompt of every Agent and Completion step', () => {
    const trigger = messageTrigger('incoming');
    const bare = agent('bare', [], null);
    const pinned = {
      ...agent('pinned', [], library(PINNED_REF, PINNED_NUMBER)),
      label: PINNED_LABEL,
    };
    const latest = completion('latest', [field('verdict')], library(LATEST_REF));
    const reply = sendText('reply', 'Hello');
    const flow: FlowDocument = {
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [trigger, bare, pinned, latest, reply],
      edges: [
        link(trigger, PortName.Next, bare),
        link(bare, PortName.Next, pinned),
        link(pinned, PortName.Next, latest),
        link(latest, PortName.Next, reply),
      ],
    };

    expect(promptReferences(flow)).toEqual([
      {
        nodeId: pinned.id,
        nodeKey: pinned.key,
        nodeLabel: PINNED_LABEL,
        promptRef: PINNED_REF,
        pin: { kind: PromptVersionKind.Pinned, number: PINNED_NUMBER },
        bindings: {},
      },
      {
        nodeId: latest.id,
        nodeKey: latest.key,
        nodeLabel: latest.label,
        promptRef: LATEST_REF,
        pin: { kind: PromptVersionKind.Latest },
        bindings: {},
      },
    ]);
  });

  it('lists nothing for steps without a prompt', () => {
    const trigger = messageTrigger('incoming');
    const bare = agent('bare', [], null);
    const flow: FlowDocument = {
      schemaVersion: FLOW_SCHEMA_VERSION,
      nodes: [trigger, bare],
      edges: [link(trigger, PortName.Next, bare)],
    };

    expect(promptReferences(flow)).toEqual([]);
  });
});
