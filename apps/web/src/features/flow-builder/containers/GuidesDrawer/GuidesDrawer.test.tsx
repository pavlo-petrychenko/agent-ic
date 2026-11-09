import { AgentTemplateKey } from '@agent-ic/flow';
import { createMemoryHistory } from '@tanstack/react-router';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { ComponentGuideId } from '@/features/flow-builder/constants/guide.constants';
import { GuidesDrawer } from '@/features/flow-builder/containers/GuidesDrawer/GuidesDrawer';
import { StepPalettePanel } from '@/features/flow-builder/containers/StepPalettePanel';
import { useGuideStore } from '@/features/flow-builder/storage/hooks/useGuideStore';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const WORKSPACE_ID = 'wsp_demo';
const AGENT_ID = 'agt_demo';
const store = useGuideStore.getState;

const renderDrawer = (history = createMemoryHistory()) => {
  renderWithProviders(
    <MemoryRouter history={history}>
      <button type="button" onClick={() => store().openGuide(null)}>
        Open guides
      </button>
      <StepPalettePanel workspaceId={WORKSPACE_ID} />
      <GuidesDrawer workspaceId={WORKSPACE_ID} agentId={AGENT_ID} />
    </MemoryRouter>,
  );
  return history;
};

describe('GuidesDrawer', () => {
  beforeEach(() => {
    act(() => store().close());
  });

  it('is not on the page until it is opened', async () => {
    renderDrawer();

    expect(await screen.findByRole('button', { name: 'Open guides' })).toBeVisible();
    expect(screen.queryByRole('complementary', { name: 'Guides' })).not.toBeInTheDocument();
  });

  it('lists the guides in the groups of the palette, then the concepts', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'Open guides' }));

    const drawer = await screen.findByRole('complementary', { name: 'Guides' });
    ['Triggers', 'AI', 'Flow', 'Actions', 'Concepts'].forEach((group) => {
      expect(within(drawer).getByRole('region', { name: group })).toBeVisible();
    });
    expect(within(drawer).getByRole('button', { name: /Router \/ condition/ })).toBeVisible();
    expect(
      within(drawer).getByRole('button', { name: /Publishing, versions and rollback/ }),
    ).toBeVisible();
  });

  it('filters the list by what is typed', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(await screen.findByRole('button', { name: 'Open guides' }));
    const drawer = await screen.findByRole('complementary', { name: 'Guides' });

    await user.type(within(drawer).getByRole('searchbox', { name: 'Search guides' }), 'knowledge');

    expect(within(drawer).getByRole('button', { name: /Knowledge bases/ })).toBeVisible();
    expect(within(drawer).queryByRole('button', { name: /Router/ })).not.toBeInTheDocument();
    expect(within(drawer).queryByRole('region', { name: 'Triggers' })).not.toBeInTheDocument();
  });

  it('opens a guide from the list and goes back to it', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(await screen.findByRole('button', { name: 'Open guides' }));
    const drawer = await screen.findByRole('complementary', { name: 'Guides' });

    await user.click(within(drawer).getByRole('button', { name: /Send message/ }));

    expect(await screen.findByRole('complementary', { name: 'Send message' })).toBeVisible();
    expect(screen.getByRole('heading', { level: 2, name: 'Send message' })).toHaveFocus();

    await user.click(screen.getByRole('button', { name: 'All guides' }));

    const list = await screen.findByRole('complementary', { name: 'Guides' });
    expect(within(list).getByRole('button', { name: /Send message/ })).toHaveFocus();
  });

  it('opens the guide of a palette step from its info button', async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'How Router / condition works' }));

    expect(store()).toMatchObject({ open: true, guideId: ComponentGuideId.Router });
    const drawer = await screen.findByRole('complementary', { name: 'Router / condition' });
    expect(within(drawer).getByRole('heading', { level: 2 })).toHaveTextContent(
      'Router / condition',
    );
    expect(within(drawer).getByRole('region', { name: 'Example' })).toBeVisible();
  });

  it('gives focus back to the info button when it closes', async () => {
    const user = userEvent.setup();
    renderDrawer();
    const opener = await screen.findByRole('button', { name: 'How Agent works' });

    await user.click(opener);
    await screen.findByRole('complementary', { name: 'Agent' });
    await user.keyboard('{Escape}');

    await waitFor(() => expect(opener).toHaveFocus());
  });

  it('starts a new agent from the example of a guide', async () => {
    const user = userEvent.setup();
    const history = renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'How Escalation / exit works' }));
    await user.click(await screen.findByRole('button', { name: 'Use as a new agent' }));

    await waitFor(() => expect(history.location.pathname).toBe(`/w/${WORKSPACE_ID}/agents`));
    const search = new URLSearchParams(history.location.search);
    expect(search.get('templates')).toBe('open');
    expect(search.get('template')).toBe(AgentTemplateKey.FaqHandOff);
  });

  it('opens a big template that uses the step', async () => {
    const user = userEvent.setup();
    const history = renderDrawer();

    await user.click(await screen.findByRole('button', { name: 'How Parallel / join works' }));
    await user.click(
      await screen.findByRole('button', {
        name: 'Open the “Online store sales assistant” template',
      }),
    );

    await waitFor(() => expect(history.location.pathname).toBe(`/w/${WORKSPACE_ID}/agents`));
    expect(history.location.search).toContain(AgentTemplateKey.StoreSales);
  });

  it('closes with its close button and shows the list again when it opens', async () => {
    const user = userEvent.setup();
    renderDrawer();
    await user.click(await screen.findByRole('button', { name: 'How Agent works' }));
    await screen.findByRole('complementary', { name: 'Agent' });

    await user.click(screen.getByRole('button', { name: 'Close guides' }));
    await waitFor(() =>
      expect(screen.queryByRole('complementary', { name: 'Agent' })).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Open guides' }));

    expect(await screen.findByRole('complementary', { name: 'Guides' })).toBeVisible();
  });
});
