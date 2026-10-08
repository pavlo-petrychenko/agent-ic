import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { buildRenameWorkspaceMock } from '@/features/settings/communication/fixtures/general.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;

const BUILDER_WORKSPACE = {
  ...DEMO_WORKSPACE,
  role: WorkspaceRole.Builder,
};

describe('workspace rename settings', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('shows the rename form for an owner', async () => {
    renderRoute(`${settingsPath}/general`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE])],
    });

    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /General/i })).toBeInTheDocument(),
    );

    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/i })).toBeInTheDocument();
  });

  it('shows NoAccess for a builder', async () => {
    renderRoute(`${settingsPath}/general`, {
      mocks: [buildWorkspaceShellMock([BUILDER_WORKSPACE])],
    });

    expect(await screen.findByText('You don’t have access to General')).toBeInTheDocument();
  });

  it('renames the workspace', async () => {
    const user = userEvent.setup();

    renderRoute(`${settingsPath}/general`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE]), buildRenameWorkspaceMock()],
    });

    const nameInput = await screen.findByLabelText('Name');

    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed workspace');

    await user.click(screen.getByRole('button', { name: /Save/i }));

    expect(await screen.findByText('Workspace renamed successfully')).toBeInTheDocument();
  });
});
