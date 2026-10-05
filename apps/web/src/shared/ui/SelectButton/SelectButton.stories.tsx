import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import type { MenuItem } from '@/shared/ui/Menu';
import { NodeKind, NodeTile, TileSize } from '@/shared/ui/NodeTile';
import { SelectButton } from '@/shared/ui/SelectButton/SelectButton';
import styles from '@/shared/ui/SelectButton/SelectButton.module.scss';

const LEAD = <NodeTile kind={NodeKind.Api} size={TileSize.Sm} aria-hidden="true" />;

const OPTIONS: readonly MenuItem[] = [
  {
    id: 'crm',
    label: 'Salon CRM',
    hint: 'live',
    leading: <NodeTile kind={NodeKind.Api} size={TileSize.Xs} aria-hidden="true" />,
  },
  {
    id: 'erp',
    label: 'Booking ERP',
    hint: 'draft',
    leading: <NodeTile kind={NodeKind.Api} size={TileSize.Xs} aria-hidden="true" />,
  },
  {
    id: 'shop',
    label: 'Online shop',
    hint: 'draft',
    leading: <NodeTile kind={NodeKind.Api} size={TileSize.Xs} aria-hidden="true" />,
  },
];

const meta = {
  component: SelectButton,
  args: { value: 'Salon CRM' },
  decorators: [
    (Story) => (
      <div className={styles.storyColumn}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SelectButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ValueAndContext: Story = {
  args: { icon: LEAD, context: 'api.salon.example' },
};
export const MonoValue: Story = {
  args: { value: 'CRM_TOKEN', mono: true, context: 'from Secrets vault' },
};
export const Short: Story = { args: { value: 'GET', className: styles.storyShort } };
export const LabelInside: Story = { args: { value: 'Salon assistant', label: 'Agent' } };
export const Open: Story = {
  args: { open: true, icon: LEAD, context: 'api.salon.example' },
};
export const Invalid: Story = {
  args: { value: 'Pick a secret', error: 'A secret is required to call this API' },
};
export const Disabled: Story = { args: { disabled: true, context: 'api.salon.example' } };
export const WithPicker: Story = {
  render: function WithPickerStory(args) {
    const [selected, setSelected] = useState('crm');
    const current = OPTIONS.find((option) => option.id === selected);
    return (
      <SelectButton
        {...args}
        value={current?.label ?? ''}
        icon={LEAD}
        options={OPTIONS}
        selectedId={selected}
        menuLabel="Connections"
        onSelect={setSelected}
      />
    );
  },
};
export const PickerOpen: Story = {
  render: function PickerOpenStory(args) {
    const [selected, setSelected] = useState('crm');
    const current = OPTIONS.find((option) => option.id === selected);
    return (
      <SelectButton
        {...args}
        value={current?.label ?? ''}
        icon={LEAD}
        options={OPTIONS}
        selectedId={selected}
        menuLabel="Connections"
        open
        onSelect={setSelected}
      />
    );
  },
};
