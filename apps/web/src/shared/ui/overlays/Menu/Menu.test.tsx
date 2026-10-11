import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from '@/shared/ui/overlays/Menu/Menu';
import {
  MENU_TYPEAHEAD_RESET_MS,
  MenuEntryKind,
  MenuRole,
  MenuVariant,
} from '@/shared/ui/overlays/Menu/Menu.constants';
import type { MenuEntry, MenuItem } from '@/shared/ui/overlays/Menu/Menu.typedefs';

const ITEMS: readonly MenuItem[] = [
  { id: 'name', label: 'user.name', hint: 'string', mono: true },
  { id: 'email', label: 'user.email', hint: 'string', mono: true },
  { id: 'plan', label: 'user.plan', hint: 'enum', mono: true, disabled: true },
  { id: 'region', label: 'user.region', hint: 'string', mono: true },
];

const FRUIT_ITEMS: readonly MenuItem[] = [
  { id: 'apple', label: 'Apple' },
  { id: 'banana', label: 'Banana' },
  { id: 'blueberry', label: 'Blueberry' },
];

const ACTION_ITEMS: readonly MenuEntry[] = [
  { kind: MenuEntryKind.Section, id: 'agent', label: 'Agent' },
  { id: 'open', label: 'Open', shortcut: '⌘O' },
  { id: 'share', label: 'Share', disabled: true, hint: 'not published' },
  { kind: MenuEntryKind.Separator, id: 'divider' },
  { id: 'delete', label: 'Delete', danger: true },
];

interface RenderMenuOptions {
  items?: readonly MenuEntry[];
  selectedId?: string | null;
  width?: number | null;
  variant?: MenuVariant;
  role?: MenuRole;
}

const renderMenu = ({
  items = ITEMS,
  selectedId = null,
  width = null,
  variant = MenuVariant.Listbox,
  role = MenuRole.Listbox,
}: RenderMenuOptions = {}) => {
  const onSelect = vi.fn<(id: string) => void>();
  render(
    <Menu
      items={items}
      selectedId={selectedId}
      onSelect={onSelect}
      width={width}
      variant={variant}
      role={role}
      ariaLabel="Variables"
    />,
  );
  return onSelect;
};

describe('Menu', () => {
  it('renders a named listbox with the options in order', () => {
    renderMenu();

    expect(screen.getByRole('listbox', { name: 'Variables' })).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'user.namestring',
      'user.emailstring',
      'user.planenum',
      'user.regionstring',
    ]);
  });

  it('marks the selected option', () => {
    renderMenu({ selectedId: 'email' });

    expect(screen.getByRole('option', { name: /user\.email/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('option', { name: /user\.name/ })).toHaveAttribute(
      'aria-selected',
      'false',
    );
  });

  it('reports the clicked option', async () => {
    const onSelect = renderMenu();

    await userEvent.click(screen.getByRole('option', { name: /user\.email/ }));

    expect(onSelect).toHaveBeenCalledWith('email');
  });

  it('ignores a disabled option', async () => {
    const onSelect = renderMenu();

    const disabled = screen.getByRole('option', { name: /user\.plan/ });
    await userEvent.click(disabled);

    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('puts the selected option in the tab order', async () => {
    renderMenu({ selectedId: 'region' });

    await userEvent.tab();

    expect(screen.getByRole('option', { name: /user\.region/ })).toHaveFocus();
  });

  it('starts at the first enabled option when nothing is selected', async () => {
    renderMenu({
      items: [
        { id: 'a', label: 'Alpha', disabled: true },
        { id: 'b', label: 'Beta' },
      ],
    });

    await userEvent.tab();

    expect(screen.getByRole('option', { name: 'Beta' })).toHaveFocus();
  });

  it('moves with arrow keys, Home and End and skips disabled options', async () => {
    renderMenu();

    await userEvent.tab();
    expect(screen.getByRole('option', { name: /user\.name/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /user\.email/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /user\.region/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /user\.region/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: /user\.email/ })).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('option', { name: /user\.region/ })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('option', { name: /user\.name/ })).toHaveFocus();
  });

  it('selects the focused option with Enter and Space', async () => {
    const onSelect = renderMenu();

    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenNthCalledWith(1, 'email');
    expect(onSelect).toHaveBeenNthCalledWith(2, 'email');
  });

  it('jumps to the option that matches the typed letters and cycles on a repeated letter', async () => {
    renderMenu({ items: FRUIT_ITEMS });

    await userEvent.tab();
    await userEvent.keyboard('b');
    expect(screen.getByRole('option', { name: 'Banana' })).toHaveFocus();

    await userEvent.keyboard('b');
    expect(screen.getByRole('option', { name: 'Blueberry' })).toHaveFocus();
  });

  it('matches several typed letters as one prefix until the pause', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderMenu({ items: FRUIT_ITEMS });

    await user.tab();
    await user.keyboard('bl');
    expect(screen.getByRole('option', { name: 'Blueberry' })).toHaveFocus();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(MENU_TYPEAHEAD_RESET_MS);
    });
    await user.keyboard('a');
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveFocus();

    vi.useRealTimers();
  });

  it('renders rich rows with a subtitle and a check on the selected one', () => {
    renderMenu({
      selectedId: 'acme',
      items: [
        { id: 'acme', label: 'Acme', hint: 'Owner', leading: <span>A</span> },
        { id: 'globex', label: 'Globex', hint: 'Member', leading: <span>G</span> },
      ],
    });

    const selected = screen.getByRole('option', { name: /Acme/ });
    expect(selected).toHaveTextContent('AAcmeOwner');
    expect(selected.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(
      screen.getByRole('option', { name: /Globex/ }).querySelector('[data-icon="check"]'),
    ).toBeNull();
  });

  it('applies the requested width', () => {
    renderMenu({ width: 320 });

    expect(screen.getByRole('listbox')).toHaveStyle({ width: '320px' });
  });
  it('renders section labels and separators outside the options', () => {
    renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action });

    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getAllByRole('option')).toHaveLength(3);
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('moves over section labels and separators with the arrow keys', async () => {
    renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action });

    await userEvent.tab();
    expect(screen.getByRole('option', { name: /Open/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('option', { name: /Delete/ })).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByRole('option', { name: /Open/ })).toHaveFocus();
  });

  it('selects the option behind a section label', async () => {
    const onSelect = renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action });

    await userEvent.click(screen.getByRole('option', { name: /Delete/ }));

    expect(onSelect).toHaveBeenCalledWith('delete');
  });

  it('shows the shortcut and the reason of a disabled action', () => {
    renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action });

    expect(screen.getByRole('option', { name: /Open/ })).toHaveTextContent('Open⌘O');
    const disabled = screen.getByRole('option', { name: /Share/ });
    expect(disabled).toHaveAttribute('aria-disabled', 'true');
    expect(disabled).toHaveTextContent('Sharenot published');
  });

  it('grows past a minimum width to fit its content', () => {
    render(
      <Menu
        items={ACTION_ITEMS}
        onSelect={vi.fn<(id: string) => void>()}
        variant={MenuVariant.Action}
        minWidth={240}
        ariaLabel="Actions"
      />,
    );

    const menu = screen.getByRole('listbox', { name: 'Actions' });
    expect(menu).toHaveStyle({ minWidth: '240px' });
    expect(menu.className).toMatch(/fit/);
  });

  it('marks a danger action', () => {
    renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action });

    expect(screen.getByRole('option', { name: /Delete/ }).className).toMatch(/danger/);
    expect(screen.getByRole('option', { name: /Open/ }).className).not.toMatch(/danger/);
  });

  it('puts the check before the label for a selected action and after it in a listbox', () => {
    const first = render(
      <Menu
        items={[{ id: 'a', label: 'Alpha', leading: <span>glyph</span> }]}
        selectedId="a"
        onSelect={vi.fn<(id: string) => void>()}
        variant={MenuVariant.Action}
        ariaLabel="Sort"
      />,
    );
    const action = screen.getByRole('option', { name: /Alpha/ });
    expect(action.firstElementChild?.querySelector('[data-icon="check"]')).not.toBeNull();
    expect(action).not.toHaveTextContent('glyph');
    first.unmount();

    render(
      <Menu
        items={[{ id: 'a', label: 'Alpha', leading: <span>glyph</span> }]}
        selectedId="a"
        onSelect={vi.fn<(id: string) => void>()}
        ariaLabel="Sort"
      />,
    );
    expect(screen.getByRole('option', { name: /Alpha/ }).lastElementChild).toHaveAttribute(
      'data-icon',
      'check',
    );
  });

  it('is a menu of menu items when it lists actions', () => {
    renderMenu({ items: ACTION_ITEMS, variant: MenuVariant.Action, role: MenuRole.Menu });

    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(3);
    expect(screen.getByRole('menuitem', { name: /Open/ })).not.toHaveAttribute('aria-selected');
    expect(screen.queryByRole('option')).toBeNull();
  });
});
