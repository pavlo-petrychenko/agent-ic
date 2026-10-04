import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Breadcrumb } from '@/shared/ui/Breadcrumb/Breadcrumb';
import { BreadcrumbSize } from '@/shared/ui/Breadcrumb/Breadcrumb.constants';
import type { BreadcrumbItem } from '@/shared/ui/Breadcrumb/Breadcrumb.typedefs';

const TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Agents', to: '/agents' },
  { label: 'Support bot', to: '/agents/support' },
  { label: 'Flows', to: '/agents/support/flows' },
  { label: 'Escalation', to: null },
];

const LONG_TRAIL: readonly BreadcrumbItem[] = [
  { label: 'Workspace', to: '/w' },
  { label: 'Agents', to: '/w/agents' },
  { label: 'Support bot', to: '/w/agents/support' },
  { label: 'Flows', to: '/w/agents/support/flows' },
  { label: 'Escalation', to: null },
];

const ENTRY_WIDTH = 100;
const COLLAPSED_ENTRY_WIDTH = 20;

const renderTrail = (items: readonly BreadcrumbItem[], size = BreadcrumbSize.Topbar) =>
  render(<Breadcrumb items={items} size={size} ariaLabel="Breadcrumb" moreLabel="Show path" />);

const mockLayout = (availableWidth: { current: number }) => {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockImplementation(
    () => availableWidth.current,
  );
  vi.spyOn(Element.prototype, 'scrollWidth', 'get').mockImplementation(function (this: Element) {
    return Array.from(this.children).reduce(
      (sum, entry) =>
        sum + (entry.querySelector('button') === null ? ENTRY_WIDTH : COLLAPSED_ENTRY_WIDTH),
      0,
    );
  });
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Breadcrumb', () => {
  it('renders a named navigation with an ordered list of the trail', () => {
    renderTrail(TRAIL);

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(within(nav).getAllByRole('listitem')).toHaveLength(TRAIL.length);
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Agents', 'Support bot', 'Flows']);
    expect(screen.getByRole('link', { name: 'Support bot' })).toHaveAttribute(
      'href',
      '/agents/support',
    );
  });

  it('marks the final item as the current page and not as a link', () => {
    renderTrail(TRAIL);

    const current = screen.getByText('Escalation');
    expect(current).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Escalation' })).not.toBeInTheDocument();
  });

  it('hides the separators from assistive technology', () => {
    const { container } = renderTrail(TRAIL);

    const separators = container.querySelectorAll('[aria-hidden="true"]');
    expect(separators).toHaveLength(TRAIL.length - 1);
    separators.forEach((separator) => expect(separator).toHaveTextContent('/'));
  });

  it('renders the header form with a single parent link and no separator', () => {
    const { container } = renderTrail([{ label: 'Agents', to: '/agents' }], BreadcrumbSize.Header);

    expect(screen.getByRole('link', { name: 'Agents' })).toHaveAttribute('href', '/agents');
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('keeps the whole trail while it fits', () => {
    mockLayout({ current: ENTRY_WIDTH * LONG_TRAIL.length });
    renderTrail(LONG_TRAIL);

    expect(screen.getAllByRole('listitem')).toHaveLength(LONG_TRAIL.length);
    expect(screen.queryByRole('button', { name: 'Show path' })).not.toBeInTheDocument();
  });

  it('collapses middle items into a menu when the trail does not fit', async () => {
    mockLayout({ current: 330 });
    renderTrail(LONG_TRAIL);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(screen.getByRole('link', { name: 'Workspace' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Flows' })).toBeInTheDocument();
    expect(screen.getByText('Escalation')).toHaveAttribute('aria-current', 'page');
    expect(screen.queryByRole('link', { name: 'Agents' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Show path' }));

    const hidden = within(screen.getByRole('dialog', { name: 'Show path' }));
    expect(hidden.getAllByRole('link').map((link) => link.textContent)).toEqual([
      'Agents',
      'Support bot',
    ]);
  });

  it('restores the full trail when more room becomes available', () => {
    const resizeCallbacks: ResizeObserverCallback[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          resizeCallbacks.push(callback);
        }
        observe = vi.fn<() => void>();
        disconnect = vi.fn<() => void>();
      },
    );
    const availableWidth = { current: 330 };
    mockLayout(availableWidth);
    renderTrail(LONG_TRAIL);
    expect(screen.getByRole('button', { name: 'Show path' })).toBeInTheDocument();

    availableWidth.current = ENTRY_WIDTH * LONG_TRAIL.length;
    act(() => {
      resizeCallbacks.forEach((callback) =>
        callback(
          [{ contentRect: { width: availableWidth.current } } as ResizeObserverEntry],
          {} as ResizeObserver,
        ),
      );
    });

    expect(screen.getAllByRole('listitem')).toHaveLength(LONG_TRAIL.length);
    expect(screen.queryByRole('button', { name: 'Show path' })).not.toBeInTheDocument();
  });
});
