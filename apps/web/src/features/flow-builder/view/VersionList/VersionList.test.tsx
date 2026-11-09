import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { VersionListItem } from '@/features/flow-builder/typedefs/versions.typedefs';
import { VersionList } from '@/features/flow-builder/view/VersionList/VersionList';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const ITEMS: VersionListItem[] = [
  { id: 'ver_2', number: 2, live: true, note: null, meta: 'Olena' },
  { id: 'ver_1', number: 1, live: false, note: 'First release', meta: 'Olena' },
];

const renderList = (canRollback: boolean, canRestore = true) => {
  const onRollback = vi.fn<(id: string) => void>();
  const onRestore = vi.fn<(id: string) => void>();
  renderWithProviders(
    <VersionList
      items={ITEMS}
      canRollback={canRollback}
      canRestore={canRestore}
      onRollback={onRollback}
      onRestore={onRestore}
    />,
  );
  return { onRollback, onRestore };
};

const card = (name: string) => screen.getByRole('listitem', { name });

describe('VersionList', () => {
  it('marks the live version and offers a roll back only on older versions', async () => {
    const { onRollback } = renderList(true);

    expect(within(card('v2')).getByText('Live')).toBeInTheDocument();
    expect(within(card('v2')).queryByRole('button', { name: 'Roll back' })).toBeNull();
    expect(within(card('v1')).queryByText('Live')).toBeNull();
    expect(within(card('v1')).getByText('First release')).toBeInTheDocument();
    await userEvent.click(within(card('v1')).getByRole('button', { name: 'Roll back' }));
    expect(onRollback).toHaveBeenCalledWith('ver_1');
  });

  it('hides the roll back from a member who cannot publish', async () => {
    const { onRestore } = renderList(false);

    expect(screen.queryByRole('button', { name: 'Roll back' })).toBeNull();
    await userEvent.click(within(card('v1')).getByRole('button', { name: 'Restore to draft' }));
    expect(onRestore).toHaveBeenCalledWith('ver_1');
  });

  it('shows no actions to a member who cannot edit', () => {
    renderList(false, false);

    expect(screen.queryByRole('button')).toBeNull();
  });
});
