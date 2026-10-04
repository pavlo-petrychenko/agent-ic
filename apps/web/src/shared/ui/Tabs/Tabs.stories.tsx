import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Tabs } from '@/shared/ui/Tabs/Tabs';
import { TabsSize } from '@/shared/ui/Tabs/Tabs.constants';
import type { TabItem } from '@/shared/ui/Tabs/Tabs.typedefs';

const PAGE_TABS: readonly TabItem<string>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'cost', label: 'LLM cost' },
  { value: 'charts', label: 'Custom charts' },
];

const PANEL_TABS: readonly TabItem<string>[] = [
  { value: 'why', label: 'Why it escalated' },
  { value: 'contact', label: 'Contact' },
];

const DISABLED_TABS: readonly TabItem<string>[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'cost', label: 'LLM cost', disabled: true },
  { value: 'charts', label: 'Custom charts' },
];

const LINK_TABS: readonly TabItem<string>[] = [
  { value: 'overview', label: 'Overview', href: '#overview' },
  { value: 'cost', label: 'LLM cost', href: '#cost' },
  { value: 'charts', label: 'Custom charts', href: '#charts' },
];

const meta = {
  component: Tabs,
  render: (args) => <ControlledTabs {...args} />,
  args: {
    tabs: PAGE_TABS,
    value: 'overview',
    onValueChange: () => undefined,
    ariaLabel: 'Agent views',
  },
  argTypes: {
    size: { control: 'select', options: Object.values(TabsSize) },
  },
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Tabs<string>>;

export default meta;

type Story = StoryObj<typeof meta>;

type ControlledTabsProps = Parameters<typeof Tabs<string>>[0];

function ControlledTabs(props: ControlledTabsProps) {
  const [value, setValue] = useState(props.value);
  return (
    <Tabs
      {...props}
      value={value}
      onValueChange={(next) => {
        setValue(next);
        props.onValueChange(next);
      }}
    />
  );
}

export const Page: Story = {};
export const Panel: Story = {
  args: { tabs: PANEL_TABS, value: 'why', size: TabsSize.Panel, ariaLabel: 'Conversation details' },
};
export const WithDisabledTab: Story = { args: { tabs: DISABLED_TABS } };
export const AsLinks: Story = { args: { tabs: LINK_TABS } };
