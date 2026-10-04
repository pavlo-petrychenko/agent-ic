import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { Menu } from '@/shared/ui/Menu/Menu';
import { MenuEntryKind, MenuVariant } from '@/shared/ui/Menu/Menu.constants';
import type { MenuEntry, MenuItem, MenuProps } from '@/shared/ui/Menu/Menu.typedefs';

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

const ACTION_ICON_SIZE = 14;

const ACTION_ITEMS: readonly MenuEntry[] = [
  { kind: MenuEntryKind.Section, id: 'agent', label: 'Agent' },
  {
    id: 'open',
    label: 'Open',
    leading: <Icon name={IconName.ChevronRight} size={ACTION_ICON_SIZE} />,
    shortcut: '⌘O',
  },
  {
    id: 'pause',
    label: 'Pause',
    leading: <Icon name={IconName.Pause} size={ACTION_ICON_SIZE} />,
    shortcut: '⌘P',
  },
  {
    id: 'share',
    label: 'Share',
    leading: <Icon name={IconName.Link} size={ACTION_ICON_SIZE} />,
    disabled: true,
    hint: 'not published',
  },
  { kind: MenuEntryKind.Separator, id: 'divider' },
  {
    id: 'delete',
    label: 'Delete',
    leading: <Icon name={IconName.X} size={ACTION_ICON_SIZE} />,
    danger: true,
  },
];

const SORT_ITEMS: readonly MenuEntry[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'name', label: 'Name' },
  { id: 'cost', label: 'LLM cost' },
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
export const Actions: Story = {
  args: {
    items: ACTION_ITEMS,
    selectedId: null,
    variant: MenuVariant.Action,
    width: 220,
    ariaLabel: 'Agent actions',
  },
};
export const ActionsWithSelection: Story = {
  args: {
    items: SORT_ITEMS,
    selectedId: 'name',
    variant: MenuVariant.Action,
    width: 180,
    ariaLabel: 'Sort by',
  },
};
