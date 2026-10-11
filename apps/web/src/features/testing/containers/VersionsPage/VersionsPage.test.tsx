import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  LIVE_VERSION_ID,
  TEST_AGENT_ID,
  TEST_WORKSPACE_ID,
  testingAgentsMock,
} from '@/features/testing/communication/fixtures/testing.fixture';
import {
  ARCHIVED_VERSION_ID,
  DRAFT_VERSION_ID,
  failedVersionHistoryMock,
  versionDiffMock,
  versionHistoryMock,
} from '@/features/testing/communication/fixtures/versions.fixture';
import { VersionsPage } from '@/features/testing/containers/VersionsPage/VersionsPage';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const LIVE_DIFF = versionDiffMock(ARCHIVED_VERSION_ID, LIVE_VERSION_ID);

const renderPage = (mocks: readonly MockLink.MockedResponse[]) =>
  renderWithProviders(
    <MemoryRouter>
      <VersionsPage workspaceId={TEST_WORKSPACE_ID} agentId={TEST_AGENT_ID} />
    </MemoryRouter>,
    { mocks },
  );

describe('VersionsPage', () => {
  it('lists the draft and the published versions with who published them and the note', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock(), LIVE_DIFF]);

    const draft = await screen.findByRole('listitem', { name: 'v4' });
    expect(within(draft).getByText('Draft')).toBeInTheDocument();
    expect(
      within(draft).getByText('edited 5 minutes ago · 3 unpublished changes'),
    ).toBeInTheDocument();
    const live = screen.getByRole('listitem', { name: 'v3' });
    expect(within(live).getByText('Live')).toBeInTheDocument();
    expect(within(live).getByText('Pavlo · published Sep 26')).toBeInTheDocument();
    expect(within(live).getByText('Added a conversation guard')).toBeInTheDocument();
    expect(within(live).getByText('Replies come as short messages')).toBeInTheDocument();
    const archived = screen.getByRole('listitem', { name: 'v2' });
    expect(within(archived).getByText('Archived')).toBeInTheDocument();
    expect(within(archived).getByText('Pavlo · published Sep 18')).toBeInTheDocument();
  });

  it('says the agent was never published', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock({ published: [], changeCount: 2 })]);

    expect(await screen.findByText('Not published yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('keeps Publish off when the draft matches the live version', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock({ changeCount: 0 }), LIVE_DIFF]);

    expect(await screen.findByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('opens the publish dialog from the draft card', async () => {
    const user = userEvent.setup();
    renderPage([testingAgentsMock(), versionHistoryMock(), LIVE_DIFF]);

    await user.click(await screen.findByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('dialog', { name: /Publish/ })).toBeInTheDocument();
  });

  it('offers a retry when the versions fail to load', async () => {
    const user = userEvent.setup();
    renderPage([testingAgentsMock(), failedVersionHistoryMock, versionHistoryMock(), LIVE_DIFF]);

    expect(await screen.findByText("Couldn't load the versions")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('listitem', { name: 'v4' })).toBeInTheDocument();
  });

  it('shows what changed in the live version since the one before', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock(), LIVE_DIFF]);

    const panel = await screen.findByRole('region', { name: 'What changed in v3' });
    expect(within(panel).getByText('compared with v2')).toBeInTheDocument();
    expect(await within(panel).findByText('New step: Conversation guard')).toBeInTheDocument();
    expect(within(panel).getByText('Send replies: “typing…” indicator on')).toBeInTheDocument();
  });

  it('compares the draft with the newest published version', async () => {
    const user = userEvent.setup();
    renderPage([
      testingAgentsMock(),
      versionHistoryMock(),
      LIVE_DIFF,
      versionDiffMock(LIVE_VERSION_ID, DRAFT_VERSION_ID),
    ]);

    await user.click(await screen.findByRole('button', { name: 'Compare with v3' }));

    const panel = await screen.findByRole('region', { name: 'What changed in draft v4' });
    expect(await within(panel).findByText('New step: Conversation guard')).toBeInTheDocument();
  });

  it('asks to create an agent when there is none', async () => {
    renderPage([testingAgentsMock([])]);

    expect(await screen.findByText('Nothing to simulate yet')).toBeInTheDocument();
  });
});
