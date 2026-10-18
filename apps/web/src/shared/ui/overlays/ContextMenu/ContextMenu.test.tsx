import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ContextMenu } from '@/shared/ui/overlays/ContextMenu/ContextMenu';
import { useContextMenu } from '@/shared/ui/overlays/ContextMenu/useContextMenu';
import { MenuEntryKind } from '@/shared/ui/overlays/Menu';
import type { MenuEntry } from '@/shared/ui/overlays/Menu';

const ITEMS: readonly MenuEntry[] = [
  { id: 'rename', label: 'Rename' },
  { kind: MenuEntryKind.Separator, id: 'divider' },
  { id: 'delete', label: 'Delete', danger: true },
];

function Harness({ onSelect }: { onSelect: (id: string) => void }) {
  const menu = useContextMenu<string>();

  return (
    <>
      <button type="button" onContextMenu={(event) => menu.open('folder-1', event)}>
        Q&amp;A
      </button>
      <ContextMenu
        anchor={menu.state?.anchor ?? null}
        items={ITEMS}
        ariaLabel="Folder actions"
        onSelect={onSelect}
        onClose={menu.close}
      />
    </>
  );
}

describe('ContextMenu', () => {
  it('opens at the pointer after a right click', async () => {
    render(<Harness onSelect={vi.fn<(id: string) => void>()} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Q&A' }), {
      clientX: 10,
      clientY: 20,
    });

    expect(await screen.findByRole('menu', { name: 'Folder actions' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
  });

  it('reports the chosen action and closes', async () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(<Harness onSelect={onSelect} />);

    fireEvent.contextMenu(screen.getByRole('button', { name: 'Q&A' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    expect(onSelect).toHaveBeenCalledWith('delete');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
