import { AgentTemplateKey } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TemplateCard } from '@/features/agents/view/TemplateCard/TemplateCard';
import { TemplateCardSize } from '@/features/agents/view/TemplateCard/TemplateCard.constants';
import { templateCardOf as cardOf } from '@test/support/fixtures/agentTemplate.fixture';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('TemplateCard', () => {
  it('is a button named after the template that selects it', async () => {
    const onSelect = vi.fn<(key: AgentTemplateKey) => void>();
    const card = cardOf(AgentTemplateKey.MenuButtons);
    renderWithProviders(
      <TemplateCard
        card={card}
        size={TemplateCardSize.Compact}
        actionLabel={null}
        onSelect={onSelect}
      />,
    );

    const button = screen.getByRole('button', { name: card.name });
    expect(button).toHaveAccessibleDescription(card.description);
    await userEvent.click(button);

    expect(onSelect).toHaveBeenCalledWith(AgentTemplateKey.MenuButtons);
  });

  it('shows the level, the preview and the step icons', () => {
    const card = cardOf(AgentTemplateKey.MenuButtons);
    renderWithProviders(
      <TemplateCard
        card={card}
        size={TemplateCardSize.Compact}
        actionLabel={null}
        onSelect={vi.fn<(key: AgentTemplateKey) => void>()}
      />,
    );

    expect(screen.getByText('Starter')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: `Flow preview of ${card.name}` })).toBeInTheDocument();
    for (const step of card.steps) {
      expect(screen.getByRole('img', { name: step.label })).toBeInTheDocument();
    }
  });

  it('tags a template that uses knowledge and not one that does not', () => {
    const { unmount } = renderWithProviders(
      <TemplateCard
        card={cardOf(AgentTemplateKey.KnowledgeAnswers)}
        size={TemplateCardSize.Compact}
        actionLabel={null}
        onSelect={vi.fn<(key: AgentTemplateKey) => void>()}
      />,
    );
    expect(screen.getByText('Uses knowledge')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <TemplateCard
        card={cardOf(AgentTemplateKey.CloseChat)}
        size={TemplateCardSize.Compact}
        actionLabel={null}
        onSelect={vi.fn<(key: AgentTemplateKey) => void>()}
      />,
    );
    expect(screen.queryByText('Uses knowledge')).not.toBeInTheDocument();
  });

  it('collapses a long list of steps into a count', () => {
    renderWithProviders(
      <TemplateCard
        card={cardOf(AgentTemplateKey.CafeSupport)}
        size={TemplateCardSize.Featured}
        actionLabel={null}
        onSelect={vi.fn<(key: AgentTemplateKey) => void>()}
      />,
    );

    const card = cardOf(AgentTemplateKey.CafeSupport);
    expect(card.steps.length).toBeGreaterThan(6);
    expect(screen.getByText(`+${card.steps.length - 6}`)).toBeInTheDocument();
  });

  it('keeps the card static and puts the action in its own button when asked', async () => {
    const onSelect = vi.fn<(key: AgentTemplateKey) => void>();
    const card = cardOf(AgentTemplateKey.StoreSales);
    renderWithProviders(
      <TemplateCard
        card={card}
        size={TemplateCardSize.Featured}
        actionLabel="Use template"
        onSelect={onSelect}
      />,
    );

    const article = screen.getByRole('article', { name: card.name });
    expect(within(article).getAllByRole('button')).toHaveLength(1);
    await userEvent.click(within(article).getByRole('button', { name: 'Use template' }));

    expect(onSelect).toHaveBeenCalledWith(AgentTemplateKey.StoreSales);
  });
});
