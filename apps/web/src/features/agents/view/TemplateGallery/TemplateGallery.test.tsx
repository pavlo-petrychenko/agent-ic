import { AgentTemplateCategory, AgentTemplateKey } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CATEGORY_FILTER_ALL,
  GalleryTab,
} from '@/features/agents/constants/agentTemplate.constants';
import { TemplateGallery } from '@/features/agents/view/TemplateGallery/TemplateGallery';
import type { TemplateGalleryProps } from '@/features/agents/view/TemplateGallery/TemplateGallery.typedefs';
import { templateCardOf } from '@test/support/fixtures/agentTemplate.fixture';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderGallery = (props: Partial<TemplateGalleryProps> = {}) => {
  const handlers = {
    onTabChange: vi.fn<(tab: GalleryTab) => void>(),
    onCategoryChange: vi.fn<(category: string) => void>(),
    onSelect: vi.fn<(key: AgentTemplateKey) => void>(),
    onCreateBlank: vi.fn<() => void>(),
  };
  renderWithProviders(
    <TemplateGallery
      tab={GalleryTab.Snippets}
      tabCounts={{ [GalleryTab.Templates]: 2, [GalleryTab.Snippets]: 3 }}
      category={CATEGORY_FILTER_ALL}
      categories={[AgentTemplateCategory.Support, AgentTemplateCategory.Quality]}
      cards={[
        templateCardOf(AgentTemplateKey.MenuButtons),
        templateCardOf(AgentTemplateKey.GuardedReply),
      ]}
      focusKey={null}
      blankCreating={false}
      {...handlers}
      {...props}
    />,
  );
  return handlers;
};

describe('TemplateGallery', () => {
  it('shows the counts on the tabs and switches between them', async () => {
    const { onTabChange } = renderGallery();

    expect(screen.getByRole('tab', { name: /Small examples/ })).toHaveTextContent('3');
    await userEvent.click(screen.getByRole('tab', { name: /Templates/ }));

    expect(onTabChange).toHaveBeenCalledWith(GalleryTab.Templates);
  });

  it('offers the categories as one choice with all first', async () => {
    const { onCategoryChange } = renderGallery();

    const radios = screen.getAllByRole('radio').map((radio) => radio.textContent);
    expect(radios).toEqual(['All', 'Support', 'Quality']);
    expect(screen.getByRole('radio', { name: 'All' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Quality' }));

    expect(onCategoryChange).toHaveBeenCalledWith(AgentTemplateCategory.Quality);
  });

  it('hides the category choice on the templates tab', () => {
    renderGallery({ tab: GalleryTab.Templates });

    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
  });

  it('selects a card', async () => {
    const { onSelect } = renderGallery();

    await userEvent.click(
      screen.getByRole('button', { name: templateCardOf(AgentTemplateKey.GuardedReply).name }),
    );

    expect(onSelect).toHaveBeenCalledWith(AgentTemplateKey.GuardedReply);
  });

  it('starts a blank flow', async () => {
    const { onCreateBlank } = renderGallery();
    await userEvent.click(screen.getByRole('button', { name: /Blank flow/ }));
    expect(onCreateBlank).toHaveBeenCalledTimes(1);
  });

  it('disables the blank flow while it is being created', () => {
    renderGallery({ blankCreating: true });

    expect(screen.getByRole('button', { name: /Blank flow/ })).toBeDisabled();
  });

  it('puts the focus back on the card the user came from', () => {
    renderGallery({ focusKey: AgentTemplateKey.GuardedReply });

    const panel = screen.getByRole('tabpanel');
    expect(
      within(panel).getByRole('button', {
        name: templateCardOf(AgentTemplateKey.GuardedReply).name,
      }),
    ).toHaveFocus();
  });
});
