import { AgentTemplateKey } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AgentsEmpty } from '@/features/agents/view/AgentsEmpty/AgentsEmpty';
import type { AgentsEmptyProps } from '@/features/agents/view/AgentsEmpty/AgentsEmpty.typedefs';
import { templateCardOf } from '@test/support/fixtures/agentTemplate.fixture';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const templates = [
  templateCardOf(AgentTemplateKey.CafeSupport),
  templateCardOf(AgentTemplateKey.StoreSales),
];

const renderEmpty = (props: Partial<AgentsEmptyProps> = {}) => {
  const handlers = {
    onBrowseTemplates: vi.fn<() => void>(),
    onCreateBlank: vi.fn<() => void>(),
    onUseTemplate: vi.fn<(key: AgentTemplateKey) => void>(),
  };
  renderWithProviders(
    <AgentsEmpty creating={false} canCreate templates={templates} {...handlers} {...props} />,
  );
  return handlers;
};

describe('AgentsEmpty', () => {
  it('leads with the template action and keeps the blank flow second', async () => {
    const { onBrowseTemplates, onCreateBlank } = renderEmpty();

    const buttons = screen.getAllByRole('button').map((button) => button.textContent);
    expect(buttons.indexOf('Start from a template')).toBeLessThan(buttons.indexOf('Blank flow'));

    await userEvent.click(screen.getByRole('button', { name: 'Start from a template' }));
    await userEvent.click(screen.getByRole('button', { name: 'Blank flow' }));

    expect(onBrowseTemplates).toHaveBeenCalledTimes(1);
    expect(onCreateBlank).toHaveBeenCalledTimes(1);
  });

  it('shows the big templates as cards that start the template', async () => {
    const { onUseTemplate } = renderEmpty();

    const showcase = screen.getByRole('region', { name: 'Ready-made agents' });
    const cards = within(showcase).getAllByRole('article');
    expect(cards).toHaveLength(templates.length);

    const cafe = within(showcase).getByRole('article', { name: templates[0]?.name });
    await userEvent.click(within(cafe).getByRole('button', { name: 'Use template' }));

    expect(onUseTemplate).toHaveBeenCalledWith(AgentTemplateKey.CafeSupport);
  });

  it('disables the blank flow while it is being created', () => {
    renderEmpty({ creating: true });

    expect(screen.getByRole('button', { name: 'Blank flow' })).toBeDisabled();
  });

  it('leaves the creation actions out for a user who cannot create agents', () => {
    renderEmpty({ canCreate: false });

    expect(screen.getByText('No assistants yet')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Ready-made agents' })).not.toBeInTheDocument();
  });
});
