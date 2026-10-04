import type { Meta, StoryObj } from '@storybook/react-vite';
import { FilterChip } from '@/shared/ui/FilterChip/FilterChip';

const meta = {
  component: FilterChip,
  args: {
    label: 'Channel',
    value: null,
    applied: false,
    onOpen: () => undefined,
    onClear: () => undefined,
    clearLabel: 'Clear Channel filter',
  },
} satisfies Meta<typeof FilterChip>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
export const ValueNotApplied: Story = { args: { label: 'Time range', value: 'Last 24 h' } };
export const Applied: Story = {
  args: {
    label: 'Agent',
    value: 'Booking assistant',
    applied: true,
    clearLabel: 'Clear Agent filter',
  },
};
export const AppliedSeveralValues: Story = {
  args: {
    label: 'Channel',
    value: 'Telegram',
    extraCount: 1,
    applied: true,
    clearLabel: 'Clear Channel filter',
  },
};
export const Open: Story = { args: { open: true } };
export const AppliedOpen: Story = {
  args: {
    label: 'Agent',
    value: 'Booking assistant',
    applied: true,
    open: true,
    clearLabel: 'Clear Agent filter',
  },
};
export const Disabled: Story = { args: { disabled: true } };
export const AppliedDisabled: Story = {
  args: {
    label: 'Agent',
    value: 'Booking assistant',
    applied: true,
    disabled: true,
    clearLabel: 'Clear Agent filter',
  },
};
