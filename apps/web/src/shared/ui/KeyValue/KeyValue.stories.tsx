import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge, BadgeTone } from '@/shared/ui/Badge';
import { KeyValue } from '@/shared/ui/KeyValue/KeyValue';
import { KeyValueLayout } from '@/shared/ui/KeyValue/KeyValue.constants';
import { SourceBadges } from '@/shared/ui/SourceBadges/SourceBadges';
import { SourceKind } from '@/shared/ui/SourceBadges/SourceBadges.constants';
import styles from '@/shared/ui/KeyValue/KeyValue.module.scss';

const meta = {
  component: KeyValue,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    layout: { control: 'select', options: Object.values(KeyValueLayout) },
  },
} satisfies Meta<typeof KeyValue>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Stacked: Story = {
  args: {
    layout: KeyValueLayout.Kv,
    items: [
      { label: 'Plan', value: 'Starter' },
      { label: 'Seats', value: '5 of 10' },
      { label: 'Renews', value: '1 Nov 2026' },
    ],
  },
};

export const DefinitionList: Story = {
  args: {
    layout: KeyValueLayout.DefList,
    items: [
      { label: 'Channel', value: 'Telegram' },
      { label: 'Conversation id', value: 'conv_8f31a2', mono: true },
      {
        label: 'Status',
        value: (
          <Badge tone={BadgeTone.Ok} dot>
            Open
          </Badge>
        ),
      },
    ],
  },
};

export const WideLabelColumn: Story = {
  args: { ...DefinitionList.args, labelWidth: 160 },
};

export const Properties: Story = {
  args: {
    layout: KeyValueLayout.Props,
    items: [
      {
        label: 'full_name',
        value: 'Olena Kovalenko',
        trailing: (
          <SourceBadges
            sources={[
              { kind: SourceKind.Channel, label: 'Channel' },
              { kind: SourceKind.Operator, label: 'Operator' },
            ]}
          />
        ),
      },
      {
        label: 'phone',
        value: '+380 50 123 4567',
        trailing: <SourceBadges sources={[{ kind: SourceKind.Flow, label: 'Flow' }]} />,
      },
      {
        label: 'plan',
        value: 'Premium',
        trailing: <SourceBadges sources={[{ kind: SourceKind.Api, label: 'API' }]} />,
      },
    ],
  },
};

export const LongValueWraps: Story = {
  args: {
    layout: KeyValueLayout.DefList,
    items: [
      {
        label: 'Webhook',
        value: 'https://example.com/hooks/telegram/8f31a2c4-1b7e-4d09-a5c3-92e4f0b6d1aa/updates',
        mono: true,
      },
    ],
  },
};
