import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  ComponentGuideId,
  ConceptGuideId,
  GuideGroup,
} from '@/features/flow-builder/constants/guide.constants';
import type { GuideListSection } from '@/features/flow-builder/typedefs/guide.typedefs';
import { GuideList } from '@/features/flow-builder/view/GuideList/GuideList';
import { NodeKind } from '@/shared/ui/display/NodeTile';
import { IconName } from '@/shared/ui/foundations/Icon';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const SECTIONS: readonly GuideListSection[] = [
  {
    group: GuideGroup.Ai,
    items: [
      {
        id: ComponentGuideId.Agent,
        title: 'Agent',
        summary: 'An AI that answers',
        kind: NodeKind.Agent,
        icon: IconName.Agent,
      },
    ],
  },
  {
    group: GuideGroup.Concepts,
    items: [
      {
        id: ConceptGuideId.Variables,
        title: 'Variables and outputs',
        summary: 'Pass data between steps',
        kind: NodeKind.Var,
        icon: IconName.Var,
      },
    ],
  },
];

const renderList = (props: Partial<Parameters<typeof GuideList>[0]> = {}) => {
  const handlers = {
    onQueryChange: vi.fn<(query: string) => void>(),
    onSelect: vi.fn<(id: string) => void>(),
    onClose: vi.fn<() => void>(),
  };
  renderWithProviders(
    <GuideList sections={SECTIONS} query="" focusId={null} {...handlers} {...props} />,
  );
  return handlers;
};

describe('GuideList', () => {
  it('lists the guides in groups with a summary each', () => {
    renderList();

    const ai = screen.getByRole('region', { name: 'AI' });
    expect(within(ai).getByRole('button', { name: /Agent/ })).toHaveTextContent(
      'An AI that answers',
    );
    const concepts = screen.getByRole('region', { name: 'Concepts' });
    expect(within(concepts).getByRole('button', { name: /Variables and outputs/ })).toBeVisible();
  });

  it('opens the guide that is picked', async () => {
    const { onSelect } = renderList();

    await userEvent.click(screen.getByRole('button', { name: /Variables and outputs/ }));

    expect(onSelect).toHaveBeenCalledWith(ConceptGuideId.Variables);
  });

  it('reports what is typed in the search and can clear it', async () => {
    const { onQueryChange } = renderList({ query: 'age' });

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search guides' }), 's');
    expect(onQueryChange).toHaveBeenLastCalledWith('ages');

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(onQueryChange).toHaveBeenLastCalledWith('');
  });

  it('says when nothing matches', () => {
    renderList({ sections: [], query: 'zzz' });

    expect(screen.getByRole('status')).toHaveTextContent('No guides match your search');
  });

  it('can be closed', async () => {
    const { onClose } = renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Close guides' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('puts the focus on the guide it returns to', () => {
    renderList({ focusId: ConceptGuideId.Variables });

    expect(screen.getByRole('button', { name: /Variables and outputs/ })).toHaveFocus();
  });

  it('is reached with the keyboard, one guide after the other', async () => {
    renderList();

    await userEvent.tab();
    await userEvent.tab();
    expect(screen.getByRole('searchbox', { name: 'Search guides' })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Agent/ })).toHaveFocus();
    await userEvent.tab();
    expect(screen.getByRole('button', { name: /Variables and outputs/ })).toHaveFocus();
  });
});
