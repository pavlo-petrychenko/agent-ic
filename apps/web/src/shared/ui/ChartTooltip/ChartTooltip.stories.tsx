import type { Meta, StoryObj } from '@storybook/react-vite';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { ChartTooltip } from '@/shared/ui/ChartTooltip/ChartTooltip';
import { ChartTooltipPlacement } from '@/shared/ui/ChartTooltip/ChartTooltip.constants';
import { ChartColor } from '@/shared/ui/Legend';
import styles from '@/shared/ui/ChartTooltip/ChartTooltip.module.scss';

const BOUNDS = { width: 384, height: 144 };

const TWO_SERIES = [
  { id: 'telegram', label: 'Telegram', value: '240', color: ChartColor.Chart1 },
  { id: 'api', label: 'API', value: '96', color: ChartColor.Chart2 },
];

const meta = {
  component: ChartTooltip,
  args: {
    title: 'Tue, Sep 29',
    rows: [{ id: 'value', label: null, value: '301 chats', color: null }],
    anchor: { x: 192, y: 96 },
    placement: ChartTooltipPlacement.Above,
    bounds: BOUNDS,
  },
  decorators: [
    (Story) => (
      <div className={styles.storyStage}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ChartTooltip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SingleRow: Story = {};
export const SingleRowFlippedBelow: Story = { args: { anchor: { x: 192, y: 12 } } };
export const TwoSeries: Story = {
  args: {
    title: 'Mon, Sep 28',
    rows: TWO_SERIES,
    anchor: { x: 120, y: 8 },
    placement: ChartTooltipPlacement.Right,
  },
};
export const TwoSeriesFlippedLeft: Story = {
  args: {
    title: 'Wed, Sep 30',
    rows: TWO_SERIES,
    anchor: { x: 360, y: 8 },
    placement: ChartTooltipPlacement.Right,
  },
};
export const SingleRowDark: Story = { globals: { theme: ResolvedTheme.Dark } };
export const TwoSeriesDark: Story = {
  ...TwoSeries,
  globals: { theme: ResolvedTheme.Dark },
};
