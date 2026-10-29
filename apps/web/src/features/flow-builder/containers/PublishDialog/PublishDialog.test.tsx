import {
  ChannelSelectionMode,
  FLOW_SCHEMA_VERSION,
  NO_FLOW_SETTINGS,
  NodeType,
  PortName,
} from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DEMO_AGENT_ID } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import {
  MISSING_PROMPT_ERROR,
  NO_ERROR_PATH_WARNING,
  RELEASE_NOTE,
  REPLY_NODE_ID,
  publishAgentFailedMock,
  publishAgentMock,
  publishPreviewMock,
} from '@/features/flow-builder/communication/fixtures/publish.fixture';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { PublishDialog } from '@/features/flow-builder/containers/PublishDialog/PublishDialog';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const ORIGIN = { x: 0, y: 0 };
const UNKNOWN_CODE = 'FUTURE_CHECK';

const FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  settings: NO_FLOW_SETTINGS,
  nodes: [
    {
      id: 'trigger',
      key: 'trigger',
      label: 'Customer message',
      position: ORIGIN,
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    },
    {
      id: REPLY_NODE_ID,
      key: REPLY_NODE_ID,
      label: 'Send replies',
      position: ORIGIN,
      ...NODE_TEMPLATES[NodeType.SendMessage],
    },
  ],
  edges: [{ id: 'e1', source: 'trigger', sourcePort: PortName.Next, target: REPLY_NODE_ID }],
};

const renderDialog = (
  mocks: readonly MockLink.MockedResponse[],
  saveState: SaveState = SaveState.Idle,
) => {
  const onPublished = vi.fn<() => void>();
  const onClose = vi.fn<() => void>();
  const onFix = vi.fn<(nodeId: string) => void>();
  renderWithProviders(
    <PublishDialog
      agentId={DEMO_AGENT_ID}
      agentName="Salon assistant"
      document={FLOW}
      revision={4}
      saveState={saveState}
      onFix={onFix}
      onPublished={onPublished}
      onClose={onClose}
    />,
    { mocks },
  );
  return { onPublished, onClose, onFix };
};

const publishButton = () => screen.getByRole('button', { name: 'Publish v4' });

describe('PublishDialog', () => {
  it('lists the changes in plain words and the checks', async () => {
    renderDialog([publishPreviewMock({ warnings: [NO_ERROR_PATH_WARNING] })]);

    expect(
      await screen.findByRole('dialog', { name: 'Publish v4 of Salon assistant' }),
    ).toBeInTheDocument();
    expect(await screen.findByText('What changed since v3')).toBeInTheDocument();
    expect(screen.getByText('New step: Send follow-up')).toBeInTheDocument();
    expect(screen.getByText('Send replies: “typing…” indicator on')).toBeInTheDocument();
    expect(screen.getByText('Every step is connected')).toBeInTheDocument();
    expect(screen.getByText('Not tested in the simulator yet')).toBeInTheDocument();
    expect(screen.getByText('2 warnings · you can still publish')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Customers switch to v4 right away. Conversations that are mid-run finish on v3.',
      ),
    ).toBeInTheDocument();
    expect(publishButton()).toBeEnabled();
  });

  it('counts a server error it cannot read and keeps Publish off', async () => {
    renderDialog([
      publishPreviewMock({ errors: [{ ...MISSING_PROMPT_ERROR, code: UNKNOWN_CODE }] }),
    ]);

    expect(await screen.findByText('Something in the flow needs fixing')).toBeInTheDocument();
    expect(screen.queryByText('Every step is connected')).not.toBeInTheDocument();
    expect(screen.getByText('Fix 1 error to publish')).toBeInTheDocument();
    expect(publishButton()).toBeDisabled();
  });

  it('says the last save failed instead of saving', async () => {
    renderDialog([publishPreviewMock()], SaveState.Error);

    expect(
      await screen.findByText('Your latest changes weren’t saved. Retry saving, then publish.'),
    ).toBeInTheDocument();
    expect(publishButton()).toBeDisabled();
  });

  it('blocks publishing while the draft has errors and jumps to the step on Fix', async () => {
    const { onClose, onFix } = renderDialog([
      publishPreviewMock({ errors: [MISSING_PROMPT_ERROR] }),
    ]);

    expect(await screen.findByText('Send replies · Write a prompt')).toBeInTheDocument();
    expect(screen.getByText('Fix 1 error to publish')).toBeInTheDocument();
    expect(publishButton()).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Fix' }));

    expect(onFix).toHaveBeenCalledWith(REPLY_NODE_ID);
    expect(onClose).toHaveBeenCalled();
  });

  it('publishes with the release note, shows a toast and moves on', async () => {
    const { onPublished } = renderDialog([
      publishPreviewMock({ testedAt: new Date().toISOString() }),
      publishAgentMock,
    ]);

    expect(await screen.findByText('Tested in the simulator')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Release note'), RELEASE_NOTE);
    await userEvent.click(publishButton());

    expect(await screen.findByText('v4 is live')).toBeInTheDocument();
    expect(onPublished).toHaveBeenCalled();
  });

  it('keeps the dialog open with the error when publishing fails', async () => {
    const { onPublished } = renderDialog([
      publishPreviewMock(),
      publishAgentFailedMock,
      publishPreviewMock(),
    ]);

    await userEvent.type(await screen.findByLabelText('Release note'), RELEASE_NOTE);
    await userEvent.click(publishButton());

    const dialog = screen.getByRole('dialog');
    expect(await within(dialog).findByRole('alert')).toBeInTheDocument();
    expect(onPublished).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Release note')).toHaveValue(RELEASE_NOTE);
  });
});
