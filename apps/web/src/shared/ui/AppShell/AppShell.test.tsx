import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppShell } from '@/shared/ui/AppShell/AppShell';
import { AppShellNavMode } from '@/shared/ui/AppShell/AppShell.constants';
import type { AppShellProps } from '@/shared/ui/AppShell/AppShell.typedefs';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import { createFakeViewport } from '@test/support/helpers/viewport.helpers';
import styles from '@/shared/ui/AppShell/AppShell.module.scss';

const WIDE_WIDTH = 1500;
const DEFAULT_WIDTH = 1300;
const COMPACT_WIDTH = 1100;
const UNSUPPORTED_WIDTH = 900;

function renderShell(width: number, props: Partial<AppShellProps> = {}) {
  const viewport = createFakeViewport(width);
  vi.stubGlobal('matchMedia', viewport.matchMedia);
  const onDetailOpenChange = vi.fn<(open: boolean) => void>();
  const view = render(
    <AppShell
      nav={<p>Sidebar</p>}
      rail={<p>Rail</p>}
      topbar={<p>Topbar</p>}
      panes={<p>Canvas</p>}
      detail={<p>Inspector</p>}
      detailOpen
      onDetailOpenChange={onDetailOpenChange}
      detailLabel="Details"
      narrowScreen={{ title: 'Open on a wider screen', description: null }}
      {...props}
    />,
  );
  return { viewport, onDetailOpenChange, ...view };
}

describe('AppShell', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('places the nav, topbar, panes and a docked detail on a wide screen', async () => {
    const { onDetailOpenChange } = renderShell(WIDE_WIDTH);

    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.getByText('Topbar')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Canvas');
    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('Inspector');

    await userEvent.keyboard('{Escape}');
    expect(onDetailOpenChange).not.toHaveBeenCalled();
  });

  it('keeps the sidebar and the docked detail on a default-width screen', () => {
    renderShell(DEFAULT_WIDTH);

    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.queryByText('Rail')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('Inspector');
  });

  it('collapses to the rail and moves the detail into a drawer below 1280', async () => {
    const { onDetailOpenChange } = renderShell(COMPACT_WIDTH);

    expect(screen.getByText('Rail')).toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('Inspector');

    await userEvent.keyboard('{Escape}');
    expect(onDetailOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the nav it was given when no rail is supplied', () => {
    renderShell(COMPACT_WIDTH, { rail: null });

    expect(screen.getByText('Sidebar')).toBeInTheDocument();
  });

  it('keeps the rail at every width when the nav mode forces it', () => {
    renderShell(WIDE_WIDTH, { navMode: AppShellNavMode.Rail, nav: <p>Rail only</p> });

    expect(screen.getByText('Rail only')).toBeInTheDocument();
    expect(screen.queryByText('Rail')).not.toBeInTheDocument();
  });

  it('shows no detail while it is closed or when there is none', () => {
    const { rerender } = renderShell(WIDE_WIDTH, { detailOpen: false });
    expect(screen.queryByText('Inspector')).not.toBeInTheDocument();

    rerender(
      <AppShell
        nav={<p>Sidebar</p>}
        topbar={null}
        panes={<p>Canvas</p>}
        detail={null}
        detailOpen
        onDetailOpenChange={vi.fn<(open: boolean) => void>()}
        detailLabel="Details"
      />,
    );
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('keeps the open detail when the window is resized across 1280', () => {
    const { viewport } = renderShell(WIDE_WIDTH);

    act(() => viewport.setWidth(COMPACT_WIDTH));

    expect(screen.getByRole('complementary', { name: 'Details' })).toHaveTextContent('Inspector');
    expect(screen.getByText('Rail')).toBeInTheDocument();
  });

  it('replaces the app with the notice below 1024 and brings it back, state intact, above it', () => {
    const { viewport, container } = renderShell(UNSUPPORTED_WIDTH);

    expect(screen.getByRole('heading', { name: 'Open on a wider screen' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Open on a wider screen');
    expect(container.querySelector(`.${cssClass(styles.root)}`)).toHaveAttribute('hidden');
    expect(screen.getByText('Canvas')).toBeInTheDocument();

    act(() => viewport.setWidth(DEFAULT_WIDTH));

    expect(
      screen.queryByRole('heading', { name: 'Open on a wider screen' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Canvas');
  });

  it('shows no notice below 1024 when the screen opts out of the guard', () => {
    renderShell(UNSUPPORTED_WIDTH, { narrowScreen: null });

    expect(
      screen.queryByRole('heading', { name: 'Open on a wider screen' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Canvas');
  });
});
