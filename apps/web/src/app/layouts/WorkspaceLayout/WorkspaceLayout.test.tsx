import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';

import { createI18n } from '@/shared/i18n/i18n';
import { Locale } from '@/shared/i18n/i18n.constants';
import { MemoryRouter } from '@/shared/testing/MemoryRouter';

import { WorkspaceLayout } from './WorkspaceLayout';

const WORKSPACE_ID = 'ws_01hzx';

describe('WorkspaceLayout', () => {
  it('shows the workspace id next to its content', async () => {
    render(
      <I18nextProvider i18n={createI18n(Locale.En)}>
        <MemoryRouter>
          <WorkspaceLayout workspaceId={WORKSPACE_ID}>
            <p>Workspace content</p>
          </WorkspaceLayout>
        </MemoryRouter>
      </I18nextProvider>,
    );

    expect(await screen.findByText(WORKSPACE_ID)).toBeInTheDocument();
    expect(screen.getByText('Workspace content')).toBeInTheDocument();
  });
});
