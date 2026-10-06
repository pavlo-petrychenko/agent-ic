import type { Meta, StoryObj } from '@storybook/react-vite';
import { userEvent, within } from 'storybook/test';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { BarChart } from '@/shared/ui/charts/BarChart/BarChart';
import type { BarDatum } from '@/shared/ui/charts/BarChart/BarChart.typedefs';
import styles from '@/shared/ui/charts/BarChart/BarChart.module.scss';

const DAYS: BarDatum[] = [
  { category: 'Thu', value: 184, tooltipLabel: 'Thu, Sep 24' },
  { category: 'Fri', value: 226, tooltipLabel: 'Fri, Sep 25' },
  { category: 'Sat', value: 142, tooltipLabel: 'Sat, Sep 26' },
  { category: 'Sun', value: 118, tooltipLabel: 'Sun, Sep 27' },
  { category: 'Mon', value: 254, tooltipLabel: 'Mon, Sep 28' },
  { category: 'Tue', value: 301, tooltipLabel: 'Tue, Sep 29' },
  { category: 'Wed', value: 268, tooltipLabel: 'Wed, Sep 30' },
];

const HIGHLIGHT_STEPS = '{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}{ArrowRight}';

const highlightTuesday: Story['play'] = async ({ canvasElement }) => {
  const chart = await within(canvasElement).findByRole('listbox');
  chart.focus();
  await userEvent.keyboard(HIGHLIGHT_STEPS);
};

const meta = {
  component: BarChart,
  args: {
    data: DAYS,
    ariaLabel: 'Conversations per day, Sep 24 to 30',
    formatValue: (value: number) => `${value} chats`,
    yTicks: [0, 100, 200, 300],
    yDomain: [0, 300],
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof BarChart>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Highlighted: Story = { play: highlightTuesday };
export const Loading: Story = {
  args: { loading: true, loadingLabel: 'Loading conversations', height: 170 },
};
export const Empty: Story = {
  args: {
    data: [],
    height: 170,
    empty: {
      title: 'No conversations in this period',
      hint: 'Try a longer period or another agent',
    },
  },
};
export const DefaultDark: Story = { globals: { theme: ResolvedTheme.Dark } };
export const HighlightedDark: Story = {
  globals: { theme: ResolvedTheme.Dark },
  play: highlightTuesday,
};
export const LoadingDark: Story = { ...Loading, globals: { theme: ResolvedTheme.Dark } };
export const EmptyDark: Story = { ...Empty, globals: { theme: ResolvedTheme.Dark } };
