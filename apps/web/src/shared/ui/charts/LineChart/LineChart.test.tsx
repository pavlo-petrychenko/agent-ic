import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LineChart } from '@/shared/ui/charts/LineChart/LineChart';
import { LineChartLegend } from '@/shared/ui/charts/LineChart/LineChart.constants';
import type { LineSeries } from '@/shared/ui/charts/LineChart/LineChart.typedefs';
import { ChartColor } from '@/shared/ui/display/Legend';

const SERIES: LineSeries[] = [
  {
    id: 'telegram',
    label: 'Telegram',
    color: ChartColor.Chart1,
    points: [
      { x: 'Sep 27', y: 120 },
      { x: 'Sep 28', y: 180 },
      { x: 'Sep 29', y: 240 },
    ],
  },
  {
    id: 'api',
    label: 'API',
    color: ChartColor.Chart2,
    points: [
      { x: 'Sep 27', y: 60 },
      { x: 'Sep 28', y: null },
      { x: 'Sep 29', y: 90 },
    ],
  },
];

const formatValue = (value: number) => `${value}`;
const formatTitle = (x: string) => `Day ${x}`;

const markers = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('circle[data-series]')).map((marker) =>
    marker.getAttribute('data-series'),
  );

describe('LineChart', () => {
  it('draws a line per visible series and labels the chart', () => {
    const { container } = render(
      <LineChart series={SERIES} ariaLabel="Conversations by channel" formatValue={formatValue} />,
    );

    expect(screen.getByRole('listbox', { name: 'Conversations by channel' })).toBeInTheDocument();
    expect(container.querySelectorAll('.recharts-line')).toHaveLength(2);
    expect(markers(container)).toEqual([]);
  });

  it('marks the last point of each series when asked', () => {
    const { container } = render(
      <LineChart
        series={SERIES.slice(0, 1)}
        ariaLabel="Quality"
        formatValue={formatValue}
        showEndMarker
      />,
    );

    expect(markers(container)).toEqual(['telegram']);
  });

  it('shows a tooltip row for every series with a value at the highlighted x', async () => {
    const { container } = render(
      <LineChart
        series={SERIES}
        ariaLabel="Conversations by channel"
        formatValue={formatValue}
        formatTitle={formatTitle}
      />,
    );

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Day Sep 27Telegram120API60',
    );
    expect(markers(container)).toEqual(['telegram', 'api']);

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent(
      'Day Sep 28Telegram180',
    );
    expect(markers(container)).toEqual(['telegram']);
  });

  it('leaves hidden series out of the plot and the tooltip', async () => {
    const { container } = render(
      <LineChart
        series={SERIES}
        ariaLabel="Conversations by channel"
        formatValue={formatValue}
        hiddenSeriesIds={['api']}
      />,
    );

    await userEvent.tab();
    await userEvent.keyboard('{Home}');

    expect(container.querySelectorAll('.recharts-line')).toHaveLength(1);
    expect(screen.getByRole('tooltip', { hidden: true })).not.toHaveTextContent('API');
  });

  it('renders the series legend on top and reports toggles', async () => {
    const onToggleSeries = vi.fn<(id: string) => void>();
    render(
      <LineChart
        series={SERIES}
        ariaLabel="Conversations by channel"
        formatValue={formatValue}
        legend={LineChartLegend.Top}
        legendLabel="Channels"
        onToggleSeries={onToggleSeries}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'API' }));

    expect(screen.getByRole('list', { name: 'Channels' })).toBeInTheDocument();
    expect(onToggleSeries).toHaveBeenCalledWith('api');
  });

  it('shows the empty text when no series has a value', () => {
    render(
      <LineChart
        series={[]}
        ariaLabel="Conversations by channel"
        formatValue={formatValue}
        empty={{ title: 'No data yet', hint: null }}
      />,
    );

    expect(screen.getByText('No data yet')).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('shows the loading placeholder', () => {
    render(
      <LineChart
        series={SERIES}
        ariaLabel="Conversations by channel"
        formatValue={formatValue}
        loading
        loadingLabel="Loading chart"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
  });
});
