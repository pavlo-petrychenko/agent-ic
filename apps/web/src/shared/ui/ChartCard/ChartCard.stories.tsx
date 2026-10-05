import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { Badge, BadgeTone } from '@/shared/ui/Badge';
import { BarChart, type BarDatum } from '@/shared/ui/BarChart';
import { ChartCard } from '@/shared/ui/ChartCard/ChartCard';
import { ChartColor, Legend, type LegendItem, LegendMarkerKind } from '@/shared/ui/Legend';
import { LineChart, type LineSeries } from '@/shared/ui/LineChart';
import styles from '@/shared/ui/ChartCard/ChartCard.module.scss';

const DAYS: BarDatum[] = [
  { category: 'Thu', value: 184, tooltipLabel: 'Thu, Sep 24' },
  { category: 'Fri', value: 226, tooltipLabel: 'Fri, Sep 25' },
  { category: 'Sat', value: 142, tooltipLabel: 'Sat, Sep 26' },
  { category: 'Sun', value: 118, tooltipLabel: 'Sun, Sep 27' },
  { category: 'Mon', value: 254, tooltipLabel: 'Mon, Sep 28' },
  { category: 'Tue', value: 301, tooltipLabel: 'Tue, Sep 29' },
  { category: 'Wed', value: 268, tooltipLabel: 'Wed, Sep 30' },
];

const X = ['Sep 24', 'Sep 25', 'Sep 26', 'Sep 27', 'Sep 28', 'Sep 29', 'Sep 30'];

const line = (id: string, label: string, color: ChartColor, values: number[]): LineSeries => ({
  id,
  label,
  color,
  points: X.map((x, index) => ({ x, y: values[index] ?? null })),
});

const QUALITY = [line('quality', 'Quality', ChartColor.Chart1, [72, 75, 74, 78, 81, 80, 84])];

const CHANNELS = [
  line('telegram', 'Telegram', ChartColor.Chart1, [180, 210, 160, 150, 240, 270, 250]),
  line('api', 'API', ChartColor.Chart2, [90, 110, 70, 60, 96, 130, 120]),
  line('widget', 'Web widget', ChartColor.Chart3, [40, 55, 30, 20, 60, 75, 70]),
];

const LEGEND_ITEMS: LegendItem[] = CHANNELS.map((entry) => ({
  id: entry.id,
  label: entry.label,
  marker: { kind: LegendMarkerKind.Series, color: entry.color },
}));

const formatChats = (value: number) => `${value} chats`;
const formatPlain = (value: number) => `${value}`;

const bar = (
  <BarChart
    data={DAYS}
    ariaLabel="Conversations per day"
    formatValue={formatChats}
    yTicks={[0, 100, 200, 300]}
    yDomain={[0, 300]}
  />
);

const meta = {
  component: ChartCard,
  args: { title: 'Conversations per day', meta: 'Sep 24 – 30', children: bar },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Bars: Story = {};
export const CustomBadge: Story = {
  args: {
    title: 'Average quality score',
    meta: <Badge tone={BadgeTone.Violet}>custom</Badge>,
    children: (
      <LineChart
        series={QUALITY}
        ariaLabel="Average quality score"
        formatValue={formatPlain}
        yTicks={[60, 70, 80, 90]}
        yDomain={[60, 90]}
        height={150}
        showEndMarker
      />
    ),
  },
};
export const WithLegend: Story = {
  args: { title: 'Conversations per day by channel' },
  render: function WithLegendStory(args) {
    const [hidden, setHidden] = useState<string[]>(['widget']);
    const toggle = (id: string) =>
      setHidden((current) =>
        current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id],
      );
    return (
      <ChartCard
        {...args}
        legend={
          <Legend items={LEGEND_ITEMS} hiddenIds={hidden} onToggle={toggle} ariaLabel="Channels" />
        }
      >
        <LineChart
          series={CHANNELS}
          ariaLabel="Conversations per day by channel"
          formatValue={formatPlain}
          yTicks={[0, 100, 200, 300]}
          yDomain={[0, 300]}
          hiddenSeriesIds={hidden}
        />
      </ChartCard>
    );
  },
};
export const Loading: Story = {
  args: {
    children: (
      <BarChart
        data={DAYS}
        ariaLabel="Conversations per day"
        formatValue={formatChats}
        loading
        loadingLabel="Loading conversations"
        height={170}
      />
    ),
  },
};
export const Empty: Story = {
  args: {
    children: (
      <BarChart
        data={[]}
        ariaLabel="Conversations per day"
        formatValue={formatChats}
        height={170}
        empty={{
          title: 'No conversations in this period',
          hint: 'Try a longer period or another agent',
        }}
      />
    ),
  },
};
export const BarsDark: Story = { globals: { theme: ResolvedTheme.Dark } };
export const CustomBadgeDark: Story = { ...CustomBadge, globals: { theme: ResolvedTheme.Dark } };
export const WithLegendDark: Story = { ...WithLegend, globals: { theme: ResolvedTheme.Dark } };
export const EmptyDark: Story = { ...Empty, globals: { theme: ResolvedTheme.Dark } };
