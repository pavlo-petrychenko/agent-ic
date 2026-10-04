import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { Menu } from '@/shared/ui/Menu/Menu';
import type { MenuItem, MenuProps } from '@/shared/ui/Menu/Menu.typedefs';

const VARIABLE_ITEMS: readonly MenuItem[] = [
  { id: 'name', label: 'user.name', hint: 'string', mono: true },
  { id: 'email', label: 'user.email', hint: 'string', mono: true },
  { id: 'plan', label: 'user.plan', hint: 'enum', mono: true, disabled: true },
  { id: 'region', label: 'user.region', hint: 'string', mono: true },
];

const WORKSPACE_ITEMS: readonly MenuItem[] = [
  {
    id: 'acme',
    label: 'Acme Support',
    hint: 'Owner · 12 agents',
    leading: <Icon name={IconName.User} size={16} />,
  },
  {
    id: 'globex',
    label: 'Globex',
    hint: 'Member · 3 agents',
    leading: <Icon name={IconName.User} size={16} />,
  },
  {
    id: 'initech',
    label: 'Initech',
    hint: 'Member · 1 agent',
    leading: <Icon name={IconName.User} size={16} />,
    disabled: true,
  },
];

function ControlledMenu(props: MenuProps) {
  const [selectedId, setSelectedId] = useState(props.selectedId ?? null);
  return (
    <Menu
      {...props}
      selectedId={selectedId}
      onSelect={(id) => {
        setSelectedId(id);
        props.onSelect(id);
      }}
    />
  );
}

const meta = {
  component: Menu,
  render: (args) => <ControlledMenu {...args} />,
  args: {
    items: VARIABLE_ITEMS,
    selectedId: 'email',
    onSelect: () => undefined,
    ariaLabel: 'Variables',
  },
} satisfies Meta<typeof Menu>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Simple: Story = {};
export const Rich: Story = {
  args: { items: WORKSPACE_ITEMS, selectedId: 'acme', ariaLabel: 'Workspaces' },
};
export const NothingSelected: Story = { args: { selectedId: null } };
export const Narrow: Story = { args: { width: 200 } };
