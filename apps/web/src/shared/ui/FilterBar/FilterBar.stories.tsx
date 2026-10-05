import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { FilterBar } from '@/shared/ui/FilterBar/FilterBar';
import type { FilterBarFilter } from '@/shared/ui/FilterBar/FilterBar.typedefs';
import type { FilterOption } from '@/shared/ui/FilterPicker';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/SegmentedControl';
import styles from '@/shared/ui/FilterBar/FilterBar.module.scss';

enum Period {
  Day = 'day',
  Week = 'week',
  Month = 'month',
}

const PERIODS = [
  { value: Period.Day, label: 'Last 24 h' },
  { value: Period.Week, label: '7 days' },
  { value: Period.Month, label: '30 days' },
];

const AGENTS: FilterOption[] = [
  { id: 'booking', label: 'Booking assistant', count: '1,204' },
  { id: 'support', label: 'Support triage', count: '846' },
];

const VERSIONS: FilterOption[] = [
  { id: 'v3', label: 'v3', count: '640' },
  { id: 'v2', label: 'v2', count: '410' },
];

const CHANNELS: FilterOption[] = [
  { id: 'telegram', label: 'Telegram', count: '1,470' },
  { id: 'api', label: 'API', count: '312' },
  { id: 'widget', label: 'Web widget', count: '88' },
];

interface BarState {
  agent: string[];
  version: string[];
  channel: string[];
}

function StatefulBar({ initial, wide }: { initial: BarState; wide: boolean }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<BarState>(initial);
  const [period, setPeriod] = useState(Period.Day);

  const filter = (
    key: keyof BarState,
    label: string,
    options: FilterOption[],
    ariaLabel: string,
  ): FilterBarFilter => ({
    id: key,
    label,
    options,
    selectedIds: state[key],
    onSelectedIdsChange: (ids) => setState((current) => ({ ...current, [key]: ids })),
    clearLabel: `Clear filter: ${label}`,
    ariaLabel,
  });

  return (
    <div className={wide ? styles.storyFrame : styles.storyNarrow}>
      <FilterBar
        ariaLabel="Run filters"
        search={{
          query,
          onQueryChange: setQuery,
          label: 'Search runs',
          clearLabel: 'Clear search',
          placeholder: 'Search runs',
        }}
        filters={[
          filter('agent', 'Agent', AGENTS, 'Agents'),
          filter('version', 'Version', VERSIONS, 'Versions'),
          filter('channel', 'Channel', CHANNELS, 'Channels'),
        ]}
        onClearAll={() => setState({ agent: [], version: [], channel: [] })}
        clearAllLabel="Clear all"
        trailing={
          <SegmentedControl
            options={PERIODS}
            value={period}
            onValueChange={setPeriod}
            ariaLabel="Period"
            size={SegmentedControlSize.Sm}
          />
        }
      />
    </div>
  );
}

const EMPTY: BarState = { agent: [], version: [], channel: [] };
const ONE_APPLIED: BarState = { agent: ['booking'], version: [], channel: [] };
const TWO_APPLIED: BarState = { agent: ['booking'], version: [], channel: ['telegram', 'api'] };

const meta = {
  component: FilterBar,
  args: { search: null, filters: [] },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NothingApplied: Story = { render: () => <StatefulBar initial={EMPTY} wide /> };
export const OneApplied: Story = { render: () => <StatefulBar initial={ONE_APPLIED} wide /> };
export const TwoAppliedWithClearAll: Story = {
  render: () => <StatefulBar initial={TWO_APPLIED} wide />,
};
export const Wrapping: Story = { render: () => <StatefulBar initial={TWO_APPLIED} wide={false} /> };
export const NothingAppliedDark: Story = {
  ...NothingApplied,
  globals: { theme: ResolvedTheme.Dark },
};
export const TwoAppliedDark: Story = {
  ...TwoAppliedWithClearAll,
  globals: { theme: ResolvedTheme.Dark },
};
