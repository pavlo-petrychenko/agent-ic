import { WorkspaceRole } from '@agent-ic/contracts';
import { EscalationMode, NodeType, NotifyChannel, RecipientsKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import {
  setChannel,
  setCustomerMessage,
  setEscalationMode,
  setRecipients,
  updateEscalate,
} from '@/features/flow-builder/logic/helpers/escalation.helpers';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';

const flow = () => addNode(EMPTY_FLOW, NodeType.Escalation, { x: 0, y: 0 }, 'e');
const config = (document: ReturnType<typeof flow>) =>
  document.nodes.find((node) => node.id === 'e')?.config;

describe('escalation helpers', () => {
  it('ends the conversation and escalates again with defaults, keeping the message', () => {
    const ended = setEscalationMode(
      setCustomerMessage(flow(), 'e', 'Bye'),
      'e',
      EscalationMode.End,
    );

    expect(config(ended)).toEqual({ mode: EscalationMode.End, customerMessage: 'Bye' });
    expect(config(setEscalationMode(ended, 'e', EscalationMode.Escalate))).toMatchObject({
      mode: EscalationMode.Escalate,
      customerMessage: 'Bye',
      reason: '',
    });
    expect(config(setCustomerMessage(ended, 'e', ''))).toMatchObject({ customerMessage: null });
    expect(updateEscalate(ended, 'e', { reason: 'x' })).toEqual(ended);
  });

  it('maps recipients to a select value', () => {
    const owners = setRecipients(flow(), 'e', WorkspaceRole.Owner);

    expect(config(owners)).toMatchObject({
      notify: { recipients: { kind: RecipientsKind.Role, role: WorkspaceRole.Owner } },
    });
    expect(setRecipients(owners, 'e', WorkspaceRole.Operator)).toEqual(owners);
  });

  it('keeps at least one notify channel', () => {
    const document = flow();

    expect(setChannel(document, 'e', NotifyChannel.InPlatform, false)).toEqual(document);
    expect(config(setChannel(document, 'e', NotifyChannel.Email, true))).toMatchObject({
      notify: { channels: [NotifyChannel.InPlatform, NotifyChannel.Email] },
    });
  });
});
