import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { userEvent, within } from 'storybook/test';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { FilterPicker } from '@/shared/ui/data/FilterBar/FilterPicker/FilterPicker';
import type {
  FilterOption,
  FilterPickerProps,
} from '@/shared/ui/data/FilterBar/FilterPicker/FilterPicker.typedefs';
import styles from '@/shared/ui/data/FilterBar/FilterPicker/FilterPicker.module.scss';

const CHANNELS: FilterOption[] = [
  { id: 'telegram', label: 'Telegram', count: '1,470' },
  { id: 'api', label: 'API', count: '312' },
  { id: 'widget', label: 'Web widget', count: '88' },
];

const AGENTS: FilterOption[] = [
  'Booking assistant',
  'Support triage',
  'Order status',
  'Returns helper',
  'Sales concierge',
  'Billing desk',
  'Onboarding guide',
  'Feedback collector',
  'Store locator',
  'Warranty checker',
].map((label, index) => ({ id: `agent-${index}`, label, count: `${(index + 1) * 37}` }));

function StatefulPicker(args: FilterPickerProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([...args.selectedIds]);
  return <FilterPicker {...args} selectedIds={selectedIds} onSelectedIdsChange={setSelectedIds} />;
}

const openPicker: Story['play'] = async ({ canvasElement }) => {
  const chip = within(canvasElement).getAllByRole('button')[0];
  if (chip !== undefined) {
    await userEvent.click(chip);
  }
};

const meta = {
  component: FilterPicker,
  args: {
    label: 'Channel',
    options: CHANNELS,
    selectedIds: [],
    onSelectedIdsChange: () => undefined,
    clearLabel: 'Clear filter: Channel',
    ariaLabel: 'Channels',
  },
  render: (args) => <StatefulPicker {...args} />,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof FilterPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const Open: Story = { play: openPicker };
export const Applied: Story = { args: { selectedIds: ['telegram'] } };
export const AppliedSeveral: Story = { args: { selectedIds: ['telegram', 'api'] } };
export const AppliedOpen: Story = { args: { selectedIds: ['telegram', 'api'] }, play: openPicker };
export const WithSearch: Story = {
  args: {
    label: 'Agent',
    options: AGENTS,
    clearLabel: 'Clear filter: Agent',
    ariaLabel: 'Agents',
    search: { label: 'Search agents', clearLabel: 'Clear search', placeholder: 'Search agents' },
  },
  play: openPicker,
};
export const Disabled: Story = { args: { disabled: true, selectedIds: ['api'] } };
export const OpenDark: Story = { play: openPicker, globals: { theme: ResolvedTheme.Dark } };
export const AppliedDark: Story = { ...AppliedSeveral, globals: { theme: ResolvedTheme.Dark } };
export const WithSearchDark: Story = { ...WithSearch, globals: { theme: ResolvedTheme.Dark } };
