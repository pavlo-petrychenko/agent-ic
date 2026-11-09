import { AgentTemplateKey } from '@agent-ic/flow';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TemplateDetail } from '@/features/agents/view/TemplateDetail/TemplateDetail';
import type {
  TemplateDetailKnowledge,
  TemplateDetailProps,
} from '@/features/agents/view/TemplateDetail/TemplateDetail.typedefs';
import { templateCardOf as cardOf } from '@test/support/fixtures/agentTemplate.fixture';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const KNOWLEDGE_HREF = '/w/ws_1/knowledge';

const knowledgeOf = (change: Partial<TemplateDetailKnowledge> = {}): TemplateDetailKnowledge => ({
  knowledgeBases: [
    { id: 'kbs_1', name: 'Café FAQ', documentCount: 3 },
    { id: 'kbs_2', name: 'Price list', documentCount: 0 },
  ],
  selectedIds: [],
  loading: false,
  failed: false,
  knowledgeHref: KNOWLEDGE_HREF,
  ...change,
});

const renderDetail = (props: Partial<TemplateDetailProps> = {}) => {
  const handlers = {
    onNameChange: vi.fn<(name: string) => void>(),
    onToggleKnowledgeBase: vi.fn<(id: string) => void>(),
    onRetryKnowledge: vi.fn<() => void>(),
    onOpenKnowledge: vi.fn<() => void>(),
    onSubmit: vi.fn<() => void>(),
  };
  const card = cardOf(AgentTemplateKey.CafeSupport);
  renderWithProviders(
    <TemplateDetail
      card={card}
      name={card.name}
      nameInvalid={false}
      knowledge={knowledgeOf()}
      disabled={false}
      {...handlers}
      {...props}
    />,
  );
  return { card, ...handlers };
};

describe('TemplateDetail', () => {
  it('describes the template with its highlights and steps', () => {
    const { card } = renderDetail();

    expect(screen.getByText(card.description)).toBeInTheDocument();
    for (const highlight of card.highlights) {
      expect(screen.getByText(highlight)).toBeInTheDocument();
    }
    for (const step of card.steps) {
      expect(screen.getByText(step.label)).toBeInTheDocument();
    }
    expect(screen.getByText(/created as a draft/)).toBeInTheDocument();
  });

  it('puts the cursor in the name field', () => {
    renderDetail();

    expect(screen.getByRole('textbox', { name: /Agent name/ })).toHaveFocus();
  });

  it('reports what the user types', async () => {
    const { onNameChange } = renderDetail();

    await userEvent.type(screen.getByRole('textbox', { name: /Agent name/ }), '!');

    expect(onNameChange).toHaveBeenCalledWith(`${cardOf(AgentTemplateKey.CafeSupport).name}!`);
  });

  it('submits from the keyboard', async () => {
    const { onSubmit } = renderDetail();

    await userEvent.type(screen.getByRole('textbox', { name: /Agent name/ }), '{Enter}');

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('explains an empty name', () => {
    renderDetail({ name: '', nameInvalid: true });

    expect(screen.getByText('Give the agent a name.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /Agent name/ })).toBeInvalid();
  });

  it('lists the knowledge bases and toggles one', async () => {
    const { onToggleKnowledgeBase } = renderDetail({
      knowledge: knowledgeOf({ selectedIds: ['kbs_2'] }),
    });

    expect(screen.getByRole('checkbox', { name: /Café FAQ/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Price list/ })).toBeChecked();
    expect(screen.getByText('3 sources')).toBeInTheDocument();
    expect(screen.getByText('No sources yet')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: /Café FAQ/ }));

    expect(onToggleKnowledgeBase).toHaveBeenCalledWith('kbs_1');
  });

  it('leaves the knowledge section out for a template that does not use knowledge', () => {
    renderDetail({ card: cardOf(AgentTemplateKey.CloseChat), knowledge: null });

    expect(screen.queryByText('Knowledge bases')).not.toBeInTheDocument();
  });

  it('shows a note while the knowledge bases load', () => {
    renderDetail({ knowledge: knowledgeOf({ loading: true }) });

    expect(screen.getByText('Loading knowledge bases…')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('offers a retry when the knowledge bases fail to load', async () => {
    const { onRetryKnowledge } = renderDetail({ knowledge: knowledgeOf({ failed: true }) });

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetryKnowledge).toHaveBeenCalledTimes(1);
  });

  it('links to the Knowledge page when there are none', async () => {
    const { onOpenKnowledge } = renderDetail({
      knowledge: knowledgeOf({ knowledgeBases: [] }),
    });

    expect(screen.getByText(/attach one later in the Agent step/)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Open Knowledge' });
    expect(link).toHaveAttribute('href', KNOWLEDGE_HREF);
    await userEvent.click(link);

    expect(onOpenKnowledge).toHaveBeenCalledTimes(1);
  });

  it('disables the form while the agent is being created', () => {
    renderDetail({ disabled: true });

    expect(screen.getByRole('textbox', { name: /Agent name/ })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: /Café FAQ/ })).toBeDisabled();
  });
});
