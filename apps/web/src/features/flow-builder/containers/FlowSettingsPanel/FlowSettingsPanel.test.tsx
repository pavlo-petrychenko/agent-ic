import {
  NotifyChannel,
  RecipientsKind,
  UnhandledFailureAction,
  validateFlow,
} from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { TRIGGER_ONLY_FLOW } from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { membersByRoleMock } from '@/features/flow-builder/communication/fixtures/membersByRole.fixture';
import { DEFAULT_HANDOFF } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { FlowSettingsPanel } from '@/features/flow-builder/containers/FlowSettingsPanel/FlowSettingsPanel';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const store = useFlowBuilderStore.getState;
const settings = () => store().document.settings;

const openSettings = () => {
  store().load({
    document: TRIGGER_ONLY_FLOW,
    revision: 1,
    issues: validateFlow(TRIGGER_ONLY_FLOW),
  });
  store().setSettingsOpen(true);
  return renderWithProviders(<FlowSettingsPanel agentName="Salon assistant" />, {
    mocks: [membersByRoleMock()],
  });
};

describe('FlowSettingsPanel', () => {
  beforeEach(() => {
    store().setSettingsOpen(false);
  });

  it('stays hidden until the toolbar opens it and closes again', async () => {
    const user = userEvent.setup();
    openSettings();

    const panel = screen.getByRole('complementary', { name: 'Flow settings' });
    expect(within(panel).getByText('Defaults for every branch of Salon assistant')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Close flow settings' }));

    expect(store().settingsOpen).toBe(false);
    expect(screen.queryByRole('complementary', { name: 'Flow settings' })).toBeNull();
  });

  it('closes when a step gets selected', () => {
    openSettings();

    store().select({ nodeIds: ['trigger'], edgeIds: [] });

    expect(store().settingsOpen).toBe(false);
  });

  it('stores the default hand-off on the first change', async () => {
    const user = userEvent.setup();
    openSettings();

    expect(settings().handoff).toBeNull();
    const recipients = screen.getByRole('combobox', { name: 'Who to notify' });
    await within(recipients).findByRole('option', { name: 'Owners · 1 person' });
    await user.selectOptions(recipients, 'owner');
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));

    expect(settings().handoff).toEqual({
      ...DEFAULT_HANDOFF,
      notify: {
        recipients: { kind: RecipientsKind.Role, role: 'owner' },
        channels: [NotifyChannel.InPlatform, NotifyChannel.Email],
      },
    });
  });

  it('apologises and hands off a failed step, or fails the run', async () => {
    const user = userEvent.setup();
    openSettings();

    expect(screen.getByRole('radio', { name: 'Fail the run' })).toBeChecked();
    await user.click(screen.getByRole('radio', { name: 'Apologise and hand off' }));

    expect(settings().onUnhandledFailure).toEqual({
      action: UnhandledFailureAction.Handoff,
      customerMessage: 'Sorry, something went wrong on our side. I’m passing you to a person.',
    });
    expect(screen.getByRole('textbox', { name: 'Apology message' })).toBeVisible();
    await user.click(screen.getByRole('radio', { name: 'Fail the run' }));

    expect(settings().onUnhandledFailure).toBeNull();
  });

  it('closes inactive conversations after a valid silence only', async () => {
    const user = userEvent.setup();
    openSettings();

    await user.click(screen.getByRole('switch', { name: 'Close after a silence' }));
    expect(settings().autoClose).toEqual({ afterMinutes: 1440 });

    const length = screen.getByRole('spinbutton', { name: 'Silence length' });
    expect(length).toHaveValue(1);
    expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveValue('days');
    await user.clear(length);
    await user.type(length, '31');

    expect(screen.getByText('Enter a whole number from 1 hour to 30 days.')).toBeVisible();
    expect(settings().autoClose).toEqual({ afterMinutes: 4320 });
    await user.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), 'hours');

    expect(settings().autoClose).toEqual({ afterMinutes: 1860 });
    expect(screen.queryByText('Enter a whole number from 1 hour to 30 days.')).toBeNull();
    await user.click(screen.getByRole('switch', { name: 'Close after a silence' }));

    expect(settings().autoClose).toBeNull();
  });
});
