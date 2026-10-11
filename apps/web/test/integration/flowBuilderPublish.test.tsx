import { MessageContentKind, NodeType, PortName } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_AGENT_ID,
  DRAFT_REVISION,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const builderPath = `/w/${DEMO_WORKSPACE.id}/agents/${DEMO_AGENT_ID}`;
const shell = buildWorkspaceShellMock([DEMO_WORKSPACE]);
const REPLY = NODE_TEMPLATES[NodeType.SendMessage];

const READY_FLOW: FlowDocument = {
  ...TRIGGER_ONLY_FLOW,
  nodes: [
    ...TRIGGER_ONLY_FLOW.nodes,
    {
      id: 'reply',
      key: 'reply',
      label: 'Say hello',
      position: { x: 0, y: 200 },
      ...REPLY,
      config: { ...REPLY.config, content: { kind: MessageContentKind.Text, text: 'Hello' } },
    },
  ],
  edges: [{ id: 'e1', source: 'trigger', sourcePort: PortName.Next, target: 'reply' }],
};

const publishButton = async (flow: FlowDocument, hasUnpublishedChanges: boolean) => {
  renderRoute(builderPath, {
    mocks: [shell, buildFlowBuilderDraftMock(flow, DRAFT_REVISION, hasUnpublishedChanges)],
  });
  return screen.findByRole('button', { name: 'Publish v4' });
};

describe('flow builder publish button', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('is on when the draft has unpublished changes', async () => {
    expect(await publishButton(READY_FLOW, true)).toBeEnabled();
  });

  it('is off when nothing changed since the live version', async () => {
    expect(await publishButton(READY_FLOW, false)).toBeDisabled();
  });

  it('is off while the flow has errors', async () => {
    expect(await publishButton(TRIGGER_ONLY_FLOW, true)).toBeDisabled();
  });
});
