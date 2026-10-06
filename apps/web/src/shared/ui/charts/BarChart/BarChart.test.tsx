import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BarChart } from '@/shared/ui/charts/BarChart/BarChart';
import { BarTone } from '@/shared/ui/charts/BarChart/BarChart.constants';
import type { BarDatum } from '@/shared/ui/charts/BarChart/BarChart.typedefs';

const DATA: BarDatum[] = [
  { category: 'Mon', value: 120, tooltipLabel: 'Mon, Sep 28' },
  { category: 'Tue', value: 301, tooltipLabel: 'Tue, Sep 29' },
  { category: 'Wed', value: 210, tooltipLabel: null },
];

const formatValue = (value: number) => `${value} chats`;

const barTones = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-tone]')).map((bar) => bar.getAttribute('data-tone'));

describe('BarChart', () => {
  it('draws one bar per datum at full strength and labels the chart', () => {
    const { container } = render(
      <BarChart data={DATA} ariaLabel="Conversations per day" formatValue={formatValue} />,
    );

    expect(screen.getByRole('listbox', { name: 'Conversations per day' })).toBeInTheDocument();
    expect(barTones(container)).toEqual([BarTone.Rest, BarTone.Rest, BarTone.Rest]);
    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('lists every value as an option and points at the highlighted one', async () => {
    render(<BarChart data={DATA} ariaLabel="Conversations per day" formatValue={formatValue} />);

    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Mon, Sep 28: 120 chats',
      'Tue, Sep 29: 301 chats',
      'Wed: 210 chats',
    ]);

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');

    const active = screen.getByRole('option', { name: 'Mon, Sep 28: 120 chats' });
    expect(active).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-activedescendant', active.id);
  });

  it('moves the highlight with the arrow keys and shows the tooltip', async () => {
    const onHighlight = vi.fn<(index: number | null) => void>();
    const { container } = render(
      <BarChart
        data={DATA}
        ariaLabel="Conversations per day"
        formatValue={formatValue}
        onHighlight={onHighlight}
      />,
    );

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{ArrowRight}');

    expect(onHighlight).toHaveBeenLastCalledWith(1);
    expect(barTones(container)).toEqual([BarTone.Dimmed, BarTone.Active, BarTone.Dimmed]);
    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Tue, Sep 29 · 301 chats',
    );

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
    expect(barTones(container)).toEqual([BarTone.Rest, BarTone.Rest, BarTone.Rest]);
  });

  it('falls back to the category when a datum has no tooltip label', async () => {
    render(<BarChart data={DATA} ariaLabel="Conversations per day" formatValue={formatValue} />);

    await userEvent.tab();
    await userEvent.keyboard('{End}');

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('Wed · 210 chats');
  });

  it('clears the highlight when the pointer leaves', async () => {
    render(<BarChart data={DATA} ariaLabel="Conversations per day" formatValue={formatValue} />);

    await userEvent.tab();
    await userEvent.keyboard('{Home}');
    fireEvent.mouseLeave(screen.getByRole('listbox'));

    expect(screen.queryByRole('tooltip', { hidden: true })).not.toBeInTheDocument();
  });

  it('shows the loading placeholder instead of the chart', () => {
    render(
      <BarChart
        data={DATA}
        ariaLabel="Conversations per day"
        formatValue={formatValue}
        loading
        loadingLabel="Loading conversations"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading conversations' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the empty text when there is no data', () => {
    render(
      <BarChart
        data={[]}
        ariaLabel="Conversations per day"
        formatValue={formatValue}
        empty={{
          title: 'No conversations in this period',
          hint: 'Try a longer period or another agent',
        }}
      />,
    );

    expect(screen.getByText('No conversations in this period')).toBeInTheDocument();
    expect(screen.getByText('Try a longer period or another agent')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
