import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildAgentsMock } from '@/features/agents/communication/fixtures/agents.fixture';
import { buildUsageStatusMock } from '@/features/settings/communication/fixtures/usage.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const agentsPath = `/w/${DEMO_WORKSPACE.id}/agents`;
const REACHED_LONG_AGO = '2026-10-09T08:00:00.000Z';
const BANNER_START = "Demo salon reached this month's usage limit";
const BANNER_START_PATTERN = /Demo salon reached this month.s usage limit/;

describe('usage limit banner', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('stays hidden below the limit', async () => {
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildUsageStatusMock(false),
      ],
    });

    expect(await screen.findByRole('heading', { name: 'Agents' })).toBeInTheDocument();
    expect(screen.queryByText(BANNER_START_PATTERN)).not.toBeInTheDocument();
    expect(screen.queryByText('Needs attention')).not.toBeInTheDocument();
  });

  it('shows the date and the way to the usage page at the limit', async () => {
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildUsageStatusMock(true, REACHED_LONG_AGO),
      ],
    });

    const banner = await screen.findByRole('alert');

    expect(banner).toHaveTextContent('on Oct 9');
    expect(banner).toHaveTextContent('until Nov 1');
    expect(within(banner).getByRole('link', { name: 'See usage' })).toHaveAttribute(
      'href',
      `/w/${DEMO_WORKSPACE.id}/settings/usage`,
    );
  });

  it('says nothing about the date when the reach time is unknown', async () => {
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildUsageStatusMock(true, null),
      ],
    });

    const banner = await screen.findByRole('alert');

    expect(banner).toHaveTextContent(BANNER_START);
    expect(banner).not.toHaveTextContent('on Oct');
    expect(banner).not.toHaveTextContent('today');
  });

  it('says today when the limit was reached today', async () => {
    renderRoute(agentsPath, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildAgentsMock([]),
        buildUsageStatusMock(true, new Date().toISOString()),
      ],
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('limit today.');
  });
});
