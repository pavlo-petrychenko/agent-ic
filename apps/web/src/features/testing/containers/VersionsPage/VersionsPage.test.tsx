import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import {
  TEST_AGENT_ID,
  TEST_WORKSPACE_ID,
  testingAgentsMock,
} from '@/features/testing/communication/fixtures/testing.fixture';
import {
  failedVersionHistoryMock,
  versionHistoryMock,
} from '@/features/testing/communication/fixtures/versions.fixture';
import { VersionsPage } from '@/features/testing/containers/VersionsPage/VersionsPage';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = (mocks: readonly MockLink.MockedResponse[]) =>
  renderWithProviders(
    <MemoryRouter>
      <VersionsPage workspaceId={TEST_WORKSPACE_ID} agentId={TEST_AGENT_ID} />
    </MemoryRouter>,
    { mocks },
  );

describe('VersionsPage', () => {
  it('lists the draft and the published versions with who published them and the note', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock()]);

    const draft = await screen.findByRole('listitem', { name: 'v4' });
    expect(within(draft).getByText('Draft')).toBeInTheDocument();
    expect(
      within(draft).getByText('edited 5 minutes ago · 3 unpublished changes'),
    ).toBeInTheDocument();
    const live = screen.getByRole('listitem', { name: 'v3' });
    expect(within(live).getByText('Live')).toBeInTheDocument();
    expect(within(live).getByText('published by Pavlo · Sep 26')).toBeInTheDocument();
    expect(within(live).getByText('Added a conversation guard')).toBeInTheDocument();
    expect(within(live).getByText('Replies come as short messages')).toBeInTheDocument();
    const archived = screen.getByRole('listitem', { name: 'v2' });
    expect(within(archived).getByText('Archived')).toBeInTheDocument();
    expect(within(archived).getByText('published by Pavlo · Sep 18')).toBeInTheDocument();
  });

  it('says the agent was never published', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock({ published: [], changeCount: 2 })]);

    expect(await screen.findByText('Not published yet')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Publish' })).toBeEnabled();
  });

  it('keeps Publish off when the draft matches the live version', async () => {
    renderPage([testingAgentsMock(), versionHistoryMock({ changeCount: 0 })]);

    expect(await screen.findByRole('button', { name: 'Publish' })).toBeDisabled();
  });

  it('opens the publish dialog from the draft card', async () => {
    const user = userEvent.setup();
    renderPage([testingAgentsMock(), versionHistoryMock()]);

    await user.click(await screen.findByRole('button', { name: 'Publish' }));

    expect(await screen.findByRole('dialog', { name: /Publish/ })).toBeInTheDocument();
  });

  it('offers a retry when the versions fail to load', async () => {
    const user = userEvent.setup();
    renderPage([testingAgentsMock(), failedVersionHistoryMock, versionHistoryMock()]);

    expect(await screen.findByText("Couldn't load the versions")).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('listitem', { name: 'v4' })).toBeInTheDocument();
  });

  it('asks to create an agent when there is none', async () => {
    renderPage([testingAgentsMock([])]);

    expect(await screen.findByText('Nothing to simulate yet')).toBeInTheDocument();
  });
});
