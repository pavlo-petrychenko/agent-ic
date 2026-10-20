import { WorkspaceRole } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { formatUsageDay, usagePeriod } from '@/features/settings/logic/helpers/usage.helpers';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };

const currentPeriodLabel = (): string => {
  const { start, end } = usagePeriod(new Date());
  return `${formatUsageDay(start, 'en')} – ${formatUsageDay(end, 'en')}`;
};

describe('usage settings', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('shows the monthly usage for an owner', async () => {
    renderRoute(`${settingsPath}/usage`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE])],
    });

    expect(await screen.findByRole('heading', { name: 'Usage' })).toBeInTheDocument();
    expect(screen.getByText('Monthly limits for Demo salon')).toBeInTheDocument();
    expect(screen.getByText('This month')).toBeInTheDocument();
    expect(screen.getByText(currentPeriodLabel())).toBeInTheDocument();
    expect(screen.getByText('Platform model usage')).toBeInTheDocument();
    expect(screen.getByText('72% of limit')).toBeInTheDocument();
    expect(screen.getByText('4,190 / 10,000')).toBeInTheDocument();
    expect(screen.getByText('107 / 5,000 chunks')).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: 'Conversations' })).toBeInTheDocument();
    expect(screen.getByText(/When a limit is reached/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ask for a higher limit' })).toBeInTheDocument();
  });

  it('keeps Usage away from an operator', async () => {
    renderRoute(`${settingsPath}/usage`, {
      mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])],
    });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to Usage' }),
    ).toBeInTheDocument();
  });
});
