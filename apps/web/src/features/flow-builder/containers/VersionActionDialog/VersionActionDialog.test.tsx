import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TRIGGER_ONLY_FLOW } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import {
  LIVE_VERSION,
  OLD_VERSION,
  ROLLBACK_REVISION,
  ROLLED_BACK_NUMBER,
  restoreVersionMock,
  rollbackAgentMock,
  rollbackBlockedMock,
} from '@/features/flow-builder/communication/fixtures/versions.fixture';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
import { VersionAction } from '@/features/flow-builder/constants/versions.constants';
import { VersionActionDialog } from '@/features/flow-builder/containers/VersionActionDialog/VersionActionDialog';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const CUSTOM_NOTE = 'Back to the short greeting';

const renderDialog = (
  action: VersionAction,
  mocks: readonly MockLink.MockedResponse[],
  changeCount = 2,
) => {
  const onDone = vi.fn<(action: VersionAction, number: number | null) => void>();
  const onClose = vi.fn<() => void>();
  renderWithProviders(
    <VersionActionDialog
      action={action}
      version={OLD_VERSION}
      liveNumber={LIVE_VERSION.number}
      nextNumber={ROLLED_BACK_NUMBER}
      changeCount={changeCount}
      onDone={onDone}
      onClose={onClose}
    />,
    { mocks },
  );
  return { onDone, onClose };
};

const rollbackButton = () => screen.getByRole('button', { name: 'Roll back to v1' });

describe('VersionActionDialog', () => {
  beforeEach(() => {
    useFlowBuilderStore
      .getState()
      .load({ document: TRIGGER_ONLY_FLOW, revision: ROLLBACK_REVISION, issues: [] });
  });

  it('explains what goes live and rolls back with the prefilled note', async () => {
    const { onDone } = renderDialog(VersionAction.Rollback, [rollbackAgentMock()]);

    expect(
      screen.getByText(
        'The flow of v1 goes live right away as v3 for new conversations. Conversations that are mid-run finish on v2.',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Your draft has 2 unpublished changes. They’ll be replaced.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Release note' })).toHaveValue(
      'Rolled back to version 1',
    );
    await userEvent.click(rollbackButton());

    await vi.waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(VersionAction.Rollback, ROLLED_BACK_NUMBER),
    );
  });

  it('sends the note the member wrote', async () => {
    const { onDone } = renderDialog(VersionAction.Rollback, [rollbackAgentMock(CUSTOM_NOTE)], 0);

    expect(screen.queryByText(/unpublished change/)).toBeNull();
    const note = screen.getByRole('textbox', { name: 'Release note' });
    await userEvent.clear(note);
    await userEvent.type(note, CUSTOM_NOTE);
    await userEvent.click(rollbackButton());

    await vi.waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(VersionAction.Rollback, ROLLED_BACK_NUMBER),
    );
  });

  it('keeps the dialog open and explains why an old version cannot go live', async () => {
    const { onDone } = renderDialog(VersionAction.Rollback, [rollbackBlockedMock]);

    await userEvent.click(rollbackButton());

    expect(await screen.findByText('Fix the flow errors before publishing.')).toBeInTheDocument();
    expect(onDone).not.toHaveBeenCalled();
  });

  it('waits for the draft to save before rolling back', () => {
    useFlowBuilderStore.getState().setSaveState(SaveState.Saving);
    renderDialog(VersionAction.Rollback, []);

    expect(screen.getByText('Saving your latest changes…')).toBeInTheDocument();
    expect(rollbackButton()).toBeDisabled();
  });

  it('restores the version into the draft without a note', async () => {
    const { onDone } = renderDialog(VersionAction.Restore, [restoreVersionMock]);

    expect(screen.queryByRole('textbox', { name: 'Release note' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Restore v1' }));

    await vi.waitFor(() =>
      expect(onDone).toHaveBeenCalledWith(VersionAction.Restore, OLD_VERSION.number),
    );
  });
});
