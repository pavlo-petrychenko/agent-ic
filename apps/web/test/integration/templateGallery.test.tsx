import { ErrorReason, Locale } from '@agent-ic/contracts';
import { AgentTemplateKey, agentTemplate } from '@agent-ic/flow';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildAgentsMock,
  buildCreateAgentFromTemplateMock,
  buildCreateAgentFromTemplateReasonFailureMock,
  buildCreateAgentMock,
  buildTemplateKnowledgeBasesFailureMock,
  buildTemplateKnowledgeBasesMock,
  CAFE_FAQ_KB,
  NEW_AGENT_ID,
  NEW_TEMPLATE_AGENT_ID,
  PRICE_LIST_KB,
  SALON_ASSISTANT,
} from '@/features/agents/communication/fixtures/agents.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { AgentTemplateKey as ApiAgentTemplateKey } from '@/shared/api/generated/schema.generated';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const agentsPath = `/w/${DEMO_WORKSPACE.id}/agents`;
const GALLERY_TITLE = 'Start a new agent';

const nameOf = (key: AgentTemplateKey, locale: Locale = Locale.En) =>
  agentTemplate(key).name[locale];

const shellMock = buildWorkspaceShellMock([DEMO_WORKSPACE]);

const openGallery = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(await screen.findByRole('button', { name: 'New agent' }));
  return screen.findByRole('dialog', { name: GALLERY_TITLE });
};

const openExamples = async (user: ReturnType<typeof userEvent.setup>) => {
  const gallery = await openGallery(user);
  await user.click(within(gallery).getByRole('tab', { name: /Big examples/ }));
  return gallery;
};

const useExistingKnowledge = async (
  user: ReturnType<typeof userEvent.setup>,
  gallery: HTMLElement,
) => {
  await user.click(
    await within(gallery).findByRole('radio', { name: 'Use existing knowledge bases' }),
  );
};

describe('template gallery', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens from the header on the templates, then big examples, small examples and blank', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, { mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])] });

    const gallery = await openGallery(user);

    expect(
      within(gallery)
        .getAllByRole('tab')
        .map((tab) => tab.textContent?.replace(/\s*\d+$/u, '')),
    ).toEqual(['Templates', 'Big examples', 'Small examples', 'Blank']);
    expect(within(gallery).getByRole('tab', { name: /Templates/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    for (const key of [
      AgentTemplateKey.FaqFromDocuments,
      AgentTemplateKey.LeadHandling,
      AgentTemplateKey.AppointmentBooking,
      AgentTemplateKey.RouteToSpecialists,
    ]) {
      expect(within(gallery).getByRole('button', { name: nameOf(key) })).toBeInTheDocument();
    }
    expect(
      within(gallery).queryByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    ).not.toBeInTheDocument();

    await user.click(within(gallery).getByRole('tab', { name: /Big examples/ }));

    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.StoreSales) }),
    ).toBeInTheDocument();
  });

  it('starts a blank flow from the gallery', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT]), buildCreateAgentMock('New agent')],
    });

    const gallery = await openGallery(user);
    await user.click(within(gallery).getByRole('tab', { name: /Blank/ }));
    await user.click(within(gallery).getByRole('button', { name: /Blank flow/ }));

    await waitFor(() => expect(history.location.pathname).toBe(`${agentsPath}/${NEW_AGENT_ID}`));
  });

  it('lists the small examples and filters them by category', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, { mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])] });

    const gallery = await openGallery(user);
    await user.click(within(gallery).getByRole('tab', { name: /Small examples/ }));

    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.GuardedReply) }),
    ).toBeInTheDocument();
    expect(
      within(gallery).queryByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    ).not.toBeInTheDocument();

    await user.click(within(gallery).getByRole('radio', { name: 'Quality' }));

    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.GuardedReply) }),
    ).toBeInTheDocument();
    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.BackgroundReview) }),
    ).toBeInTheDocument();
    expect(
      within(gallery).queryByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    ).not.toBeInTheDocument();

    await user.click(within(gallery).getByRole('radio', { name: 'All' }));

    expect(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    ).toBeInTheDocument();
  });

  it('shows the details of a selected template and goes back to the list', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT]), buildTemplateKnowledgeBasesMock([])],
    });

    const gallery = await openExamples(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    );

    expect(await screen.findByRole('dialog', { name: nameOf(AgentTemplateKey.CafeSupport) })).toBe(
      gallery,
    );
    expect(within(gallery).getByRole('textbox', { name: /Agent name/ })).toHaveValue(
      nameOf(AgentTemplateKey.CafeSupport),
    );
    expect(within(gallery).getByText('What you get')).toBeInTheDocument();
    expect(within(gallery).getByText('Steps it uses')).toBeInTheDocument();
    expect(within(gallery).getByText(/The agent is created as a draft/)).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: 'Back' }));

    const cafe = await within(gallery).findByRole('button', {
      name: nameOf(AgentTemplateKey.CafeSupport),
    });
    expect(cafe).toHaveFocus();
  });

  it('offers knowledge bases only for a template that uses knowledge', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildTemplateKnowledgeBasesMock([CAFE_FAQ_KB, PRICE_LIST_KB]),
      ],
    });

    const gallery = await openExamples(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    );

    expect(
      await within(gallery).findByRole('radio', { name: 'Create 4 new knowledge bases' }),
    ).toBeChecked();
    expect(within(gallery).getByText('Café support — menu')).toBeInTheDocument();
    await useExistingKnowledge(user, gallery);
    expect(await within(gallery).findByRole('checkbox', { name: /Café FAQ/ })).toBeInTheDocument();
    expect(within(gallery).getByRole('checkbox', { name: /Price list/ })).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: 'Back' }));
    await user.click(within(gallery).getByRole('tab', { name: /Small examples/ }));
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    );

    expect(await within(gallery).findByRole('textbox', { name: /Agent name/ })).toBeInTheDocument();
    expect(within(gallery).queryByText('Knowledge bases')).not.toBeInTheDocument();
    expect(within(gallery).queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('points to the Knowledge page when there are no knowledge bases', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT]), buildTemplateKnowledgeBasesMock([])],
    });

    const gallery = await openExamples(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.StoreSales) }),
    );
    await useExistingKnowledge(user, gallery);

    expect(await within(gallery).findByText(/You have no knowledge bases yet/)).toBeInTheDocument();
    const link = within(gallery).getByRole('link', { name: 'Open Knowledge' });
    expect(link).toHaveAttribute('href', `${agentsPath.replace('/agents', '')}/knowledge`);

    await user.click(link);

    await waitFor(() => expect(history.location.pathname).toContain('/knowledge'));
  });

  it('lets the user retry when the knowledge bases fail to load', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildTemplateKnowledgeBasesFailureMock(new Error('offline')),
        buildTemplateKnowledgeBasesMock([CAFE_FAQ_KB]),
      ],
    });

    const gallery = await openExamples(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    );
    await useExistingKnowledge(user, gallery);
    expect(await within(gallery).findByText('Could not load knowledge bases.')).toBeInTheDocument();

    await user.click(within(gallery).getByRole('button', { name: 'Try again' }));

    expect(await within(gallery).findByRole('checkbox', { name: /Café FAQ/ })).toBeInTheDocument();
  });

  it('creates the agent from the template with the chosen name and knowledge bases', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildTemplateKnowledgeBasesMock([CAFE_FAQ_KB, PRICE_LIST_KB]),
        buildCreateAgentFromTemplateMock(ApiAgentTemplateKey.CafeSupport, 'Lviv café', [
          CAFE_FAQ_KB.id,
        ]),
      ],
    });

    const gallery = await openExamples(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    );
    await useExistingKnowledge(user, gallery);
    await user.click(await within(gallery).findByRole('checkbox', { name: /Café FAQ/ }));
    const name = within(gallery).getByRole('textbox', { name: /Agent name/ });
    await user.clear(name);
    await user.type(name, '  Lviv café ');
    await user.click(within(gallery).getByRole('button', { name: 'Create agent' }));

    await waitFor(() =>
      expect(history.location.pathname).toBe(`${agentsPath}/${NEW_TEMPLATE_AGENT_ID}`),
    );
  });

  it('creates a template with a new empty knowledge base and points to it', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildTemplateKnowledgeBasesMock([CAFE_FAQ_KB]),
        buildCreateAgentFromTemplateMock(
          ApiAgentTemplateKey.FaqFromDocuments,
          'Shop',
          [],
          [{ role: null, name: 'Shop — documents' }],
        ),
      ],
    });

    const gallery = await openGallery(user);
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.FaqFromDocuments) }),
    );
    const name = await within(gallery).findByRole('textbox', { name: /Agent name/ });
    await user.clear(name);
    await user.type(name, 'Shop');

    expect(
      within(gallery).getByRole('radio', { name: 'Create a new knowledge base' }),
    ).toBeChecked();
    expect(within(gallery).getByText('Shop — documents')).toBeInTheDocument();
    await user.click(within(gallery).getByRole('button', { name: 'Create agent' }));

    await waitFor(() =>
      expect(history.location.pathname).toBe(`${agentsPath}/${NEW_TEMPLATE_AGENT_ID}`),
    );
    expect(await screen.findByText(/An empty knowledge base was created/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Upload files' }));

    await waitFor(() => expect(history.location.pathname).toContain('/knowledge'));
  });

  it('creates a small example without knowledge bases', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildCreateAgentFromTemplateMock(
          ApiAgentTemplateKey.MenuButtons,
          nameOf(AgentTemplateKey.MenuButtons),
        ),
      ],
    });

    const gallery = await openGallery(user);
    await user.click(within(gallery).getByRole('tab', { name: /Small examples/ }));
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    );
    await user.click(await within(gallery).findByRole('button', { name: 'Create agent' }));

    await waitFor(() =>
      expect(history.location.pathname).toBe(`${agentsPath}/${NEW_TEMPLATE_AGENT_ID}`),
    );
  });

  it('blocks creation while the name is empty', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, { mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])] });

    const gallery = await openGallery(user);
    await user.click(within(gallery).getByRole('tab', { name: /Small examples/ }));
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    );
    await user.clear(await within(gallery).findByRole('textbox', { name: /Agent name/ }));

    expect(within(gallery).getByText('Give the agent a name.')).toBeInTheDocument();
    expect(within(gallery).getByRole('button', { name: 'Create agent' })).toBeDisabled();
  });

  it('shows the reason inline when the agent could not be created', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [
        shellMock,
        buildAgentsMock([SALON_ASSISTANT]),
        buildCreateAgentFromTemplateReasonFailureMock(
          ApiAgentTemplateKey.MenuButtons,
          nameOf(AgentTemplateKey.MenuButtons),
          ErrorReason.AgentTemplateWithoutKnowledge,
        ),
      ],
    });

    const gallery = await openGallery(user);
    await user.click(within(gallery).getByRole('tab', { name: /Small examples/ }));
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.MenuButtons) }),
    );
    await user.click(await within(gallery).findByRole('button', { name: 'Create agent' }));

    expect(
      await within(gallery).findByText(/This template does not use knowledge bases/),
    ).toBeInTheDocument();
    expect(history.location.pathname).toBe(agentsPath);
    expect(within(gallery).getByRole('button', { name: 'Create agent' })).toBeEnabled();
  });

  it('opens on the details of the template named in the address', async () => {
    renderRoute(`${agentsPath}?templates=open&template=${AgentTemplateKey.MenuButtons}`, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])],
    });

    const gallery = await screen.findByRole('dialog', {
      name: nameOf(AgentTemplateKey.MenuButtons),
    });

    expect(within(gallery).getByRole('textbox', { name: /Agent name/ })).toHaveValue(
      nameOf(AgentTemplateKey.MenuButtons),
    );
    await waitFor(() =>
      expect(within(gallery).getByRole('textbox', { name: /Agent name/ })).toHaveFocus(),
    );
  });

  it('opens on the list when only the gallery is named in the address', async () => {
    renderRoute(`${agentsPath}?templates=open`, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])],
    });

    expect(await screen.findByRole('dialog', { name: GALLERY_TITLE })).toBeInTheDocument();
  });

  it('shows the gallery in Ukrainian', async () => {
    renderRoute(`${agentsPath}?templates=open`, {
      locale: Locale.Uk,
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE], {
          name: 'Pavlo',
          email: 'owner@demo-salon.example',
          locale: Locale.Uk,
        }),
        buildAgentsMock([SALON_ASSISTANT]),
      ],
    });

    const gallery = await screen.findByRole('dialog', { name: 'Новий агент' });

    expect(
      within(gallery).getByRole('button', {
        name: nameOf(AgentTemplateKey.FaqFromDocuments, Locale.Uk),
      }),
    ).toBeInTheDocument();
    expect(within(gallery).getByRole('tab', { name: /Великі приклади/ })).toBeInTheDocument();
    expect(within(gallery).getByRole('tab', { name: /Невеликі приклади/ })).toBeInTheDocument();
  });

  it('clears the address when the gallery closes', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(
      `${agentsPath}?templates=open&template=${AgentTemplateKey.MenuButtons}`,
      { mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT])] },
    );

    await screen.findByRole('dialog', { name: nameOf(AgentTemplateKey.MenuButtons) });
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(history.location.search).toBe('');
  });

  it('keeps the address in step with the selected template', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([SALON_ASSISTANT]), buildTemplateKnowledgeBasesMock([])],
    });

    const gallery = await openGallery(user);
    expect(history.location.search).toContain('templates=open');

    await user.click(within(gallery).getByRole('tab', { name: /Big examples/ }));
    await user.click(
      within(gallery).getByRole('button', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    );

    await waitFor(() =>
      expect(history.location.search).toContain(`template=${AgentTemplateKey.CafeSupport}`),
    );

    await user.click(within(gallery).getByRole('button', { name: 'Back' }));

    await waitFor(() => expect(history.location.search).not.toContain('template='));
  });
});

describe('empty agents page', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('offers the two templates as cards next to the setup checklist', async () => {
    renderRoute(agentsPath, { mocks: [shellMock, buildAgentsMock([])] });

    const showcase = await screen.findByRole('region', { name: 'Ready-made agents' });

    expect(within(showcase).getAllByRole('article')).toHaveLength(2);
    expect(
      within(showcase).getByRole('article', { name: nameOf(AgentTemplateKey.CafeSupport) }),
    ).toBeInTheDocument();
    expect(within(showcase).getAllByRole('button', { name: 'Use template' })).toHaveLength(2);
    expect(screen.getByText('Get set up')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'New agent' })).not.toBeInTheDocument();
  });

  it('opens the gallery from the primary action', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, { mocks: [shellMock, buildAgentsMock([])] });

    await user.click(await screen.findByRole('button', { name: 'Start from a template' }));

    expect(await screen.findByRole('dialog', { name: GALLERY_TITLE })).toBeInTheDocument();
  });

  it('opens the details of a card with its own action', async () => {
    const user = userEvent.setup();
    renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([]), buildTemplateKnowledgeBasesMock([])],
    });

    const showcase = await screen.findByRole('region', { name: 'Ready-made agents' });
    const store = within(showcase).getByRole('article', {
      name: nameOf(AgentTemplateKey.StoreSales),
    });
    await user.click(within(store).getByRole('button', { name: 'Use template' }));

    expect(
      await screen.findByRole('dialog', { name: nameOf(AgentTemplateKey.StoreSales) }),
    ).toBeInTheDocument();
  });

  it('creates a blank flow from the secondary action', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(agentsPath, {
      mocks: [shellMock, buildAgentsMock([]), buildCreateAgentMock('New agent')],
    });

    await user.click(await screen.findByRole('button', { name: 'Blank flow' }));

    await waitFor(() => expect(history.location.pathname).toBe(`${agentsPath}/${NEW_AGENT_ID}`));
  });
});
