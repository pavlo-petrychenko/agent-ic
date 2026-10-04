import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Tabs } from '@/shared/ui/Tabs/Tabs';
import type { TabItem } from '@/shared/ui/Tabs/Tabs.typedefs';

const TABS: readonly TabItem<string>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'cost', label: 'LLM cost' },
  { value: 'charts', label: 'Custom charts' },
];

const renderTabs = (tabs: readonly TabItem<string>[] = TABS) => {
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <Tabs tabs={tabs} value="overview" onValueChange={onValueChange} ariaLabel="Agent views" />,
  );
  return onValueChange;
};

describe('Tabs', () => {
  it('renders a named tablist with the selected tab marked', () => {
    renderTabs();

    expect(screen.getByRole('tablist', { name: 'Agent views' })).toBeInTheDocument();
    expect(screen.getAllByRole('tab').map((tab) => tab.textContent)).toEqual([
      'Overview',
      'LLM cost',
      'Custom charts',
    ]);
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'LLM cost' })).toHaveAttribute('aria-selected', 'false');
  });

  it('reports the tab that was clicked', async () => {
    const onValueChange = renderTabs();

    await userEvent.click(screen.getByRole('tab', { name: 'LLM cost' }));

    expect(onValueChange).toHaveBeenCalledWith('cost');
  });

  it('moves between tabs with arrow keys, Home and End', async () => {
    const onValueChange = renderTabs();

    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'LLM cost' })).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('cost');

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('tab', { name: 'Custom charts' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveFocus();
  });

  it('ignores a click on a disabled tab', async () => {
    const onValueChange = renderTabs([
      { value: 'overview', label: 'Overview' },
      { value: 'cost', label: 'LLM cost', disabled: true },
    ]);

    expect(screen.getByRole('tab', { name: 'LLM cost' })).toBeDisabled();
    await userEvent.click(screen.getByRole('tab', { name: 'LLM cost' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('skips a disabled tab with the arrow keys', async () => {
    renderTabs([
      { value: 'overview', label: 'Overview' },
      { value: 'cost', label: 'LLM cost', disabled: true },
      { value: 'charts', label: 'Custom charts' },
    ]);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Custom charts' })).toHaveFocus();
  });

  it('renders anchors with tab roles for route-driven tabs', async () => {
    const onValueChange = renderTabs([
      { value: 'overview', label: 'Overview', href: '/overview' },
      { value: 'cost', label: 'LLM cost', href: '/cost' },
    ]);

    const cost = screen.getByRole('tab', { name: 'LLM cost' });
    expect(cost.tagName).toBe('A');
    expect(cost).toHaveAttribute('href', '/cost');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(cost).toHaveFocus();
    expect(onValueChange).toHaveBeenLastCalledWith('cost');
  });

  it('drops the link from a disabled route tab', () => {
    renderTabs([
      { value: 'overview', label: 'Overview', href: '/overview' },
      { value: 'cost', label: 'LLM cost', href: '/cost', disabled: true },
    ]);

    const cost = screen.getByRole('tab', { name: 'LLM cost' });
    expect(cost).not.toHaveAttribute('href');
    expect(cost).toBeDisabled();
  });
});
