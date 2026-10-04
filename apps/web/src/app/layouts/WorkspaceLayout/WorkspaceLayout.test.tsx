import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { getRequestContext } from '@/shared/api/requestContext';
import { createI18n } from '@/shared/i18n/i18n';
import { Locale } from '@/shared/i18n/i18n.constants';
import { MemoryRouter } from '@/shared/testing/MemoryRouter';

import { WorkspaceLayout } from './WorkspaceLayout';

const WORKSPACE_ID = 'ws_01hzx';

const renderLayout = () =>
  render(
    <I18nextProvider i18n={createI18n(Locale.En)}>
      <MemoryRouter>
        <WorkspaceLayout workspaceId={WORKSPACE_ID}>
          <p>Workspace content</p>
        </WorkspaceLayout>
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('WorkspaceLayout', () => {
  it('shows the workspace id next to its content', async () => {
    renderLayout();

    expect(await screen.findByText(WORKSPACE_ID)).toBeInTheDocument();
    expect(screen.getByText('Workspace content')).toBeInTheDocument();
  });

  it('sends the workspace id with requests while it is open and forgets it on leave', async () => {
    const { unmount } = renderLayout();
    await screen.findByText(WORKSPACE_ID);

    expect(getRequestContext().workspaceId).toBe(WORKSPACE_ID);

    unmount();

    expect(getRequestContext().workspaceId).toBeNull();
  });
});
