import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { LineChart } from '@/shared/ui/charts/LineChart/LineChart';
import { LineChartLegend } from '@/shared/ui/charts/LineChart/LineChart.constants';
import type { LineSeries } from '@/shared/ui/charts/LineChart/LineChart.typedefs';
import { ChartColor } from '@/shared/ui/display/Legend';
import styles from '@/shared/ui/charts/LineChart/LineChart.module.scss';

const DAYS = ['Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28', 'Sep 29', 'Sep 30'];

const WEEKDAYS: Readonly<Record<string, string>> = {
  'Sep 24': 'Thu, Sep 24',
  'Sep 25': 'Fri, Sep 25',
  'Sep 26': 'Sat, Sep 26',
  'Sep 27': 'Sun, Sep 27',
  'Sep 28': 'Mon, Sep 28',
  'Sep 29': 'Tue, Sep 29',
  'Sep 30': 'Wed, Sep 30',
};

const series = (
  id: string,
  label: string,
  color: ChartColor,
  values: readonly (number | null)[],
): LineSeries => ({
  id,
  label,
  color,
  points: DAYS.map((x, index) => ({ x, y: values[index] ?? null })),
});

const QUALITY = [series('quality', 'Quality', ChartColor.Chart1, [72, 75, 74, 78, 81, 80, 84])];

const CHANNELS = [
  series('telegram', 'Telegram', ChartColor.Chart1, [180, 210, 160, 150, 240, 270, 250]),
  series('api', 'API', ChartColor.Chart2, [90, 110, 70, 60, 96, 130, 120]),
  series('widget', 'Web widget', ChartColor.Chart3, [40, 55, 30, 20, 60, 75, 70]),
];

const HOVER_STEPS = '{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}';

const hoverMonday: Story['play'] = async ({ canvasElement }) => {
  const chart = await within(canvasElement).findByRole('listbox');
  chart.focus();
  await userEvent.keyboard(HOVER_STEPS);
};

const meta = {
  component: LineChart,
  args: {
    series: QUALITY,
    ariaLabel: 'Average quality score, Sep 24 to 30',
    formatValue: (value: number) => `${value}`,
    formatTitle: (x: string) => WEEKDAYS[x] ?? x,
    yTicks: [60, 70, 80, 90],
    yDomain: [60, 90],
    height: 150,
    showEndMarker: true,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof LineChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleSeries: Story = {};
export const SingleSeriesHover: Story = { play: hoverMonday };
export const TwoSeries: Story = {
  args: {
    series: CHANNELS,
    ariaLabel: 'Conversations per day by channel',
    yTicks: [0, 100, 200, 300],
    yDomain: [0, 300],
    height: 200,
    showEndMarker: false,
    legend: LineChartLegend.Top,
    legendLabel: 'Channels',
    hiddenSeriesIds: ['widget'],
    onToggleSeries: () => undefined,
  },
};
export const TwoSeriesHover: Story = { ...TwoSeries, play: hoverMonday };
export const LegendToggle: Story = {
  args: TwoSeries.args,
  render: function LegendToggleStory(args) {
    const [hidden, setHidden] = useState<string[]>(['widget']);
    return (
      <LineChart
        {...args}
        hiddenSeriesIds={hidden}
        onToggleSeries={(id) =>
          setHidden((current) =>
            current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
          )
        }
      />
    );
  },
};
export const WithGap: Story = {
  args: {
    series: [series('quality', 'Quality', ChartColor.Chart1, [72, 75, null, null, 81, 80, 84])],
  },
};
export const Loading: Story = { args: { loading: true, loadingLabel: 'Loading quality' } };
export const Empty: Story = {
  args: {
    series: [],
    empty: { title: 'No scored conversations yet', hint: 'Scores appear after the first run' },
  },
};
export const SingleSeriesDark: Story = { globals: { theme: ResolvedTheme.Dark } };
export const TwoSeriesHoverDark: Story = {
  ...TwoSeriesHover,
  globals: { theme: ResolvedTheme.Dark },
};
export const LoadingDark: Story = { ...Loading, globals: { theme: ResolvedTheme.Dark } };
export const EmptyDark: Story = { ...Empty, globals: { theme: ResolvedTheme.Dark } };
