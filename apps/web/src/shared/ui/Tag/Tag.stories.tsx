import type { Meta, StoryObj } from '@storybook/react-vite';
import { Tag } from '@/shared/ui/Tag/Tag';
import { TagKind } from '@/shared/ui/Tag/Tag.constants';
import styles from '@/shared/ui/Tag/Tag.module.scss';

const meta = {
  component: Tag,
  args: { kind: TagKind.Kb, children: 'Product catalogue' },
  argTypes: {
    kind: { control: 'select', options: Object.values(TagKind) },
    mono: { control: 'select', options: [null, true, false] },
  },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllKinds: Story = {
  render: (args) => (
    <div className={styles.row}>
      <Tag {...args} kind={TagKind.Kb}>
        Product catalogue
      </Tag>
      <Tag {...args} kind={TagKind.Tool}>
        check_order_status
      </Tag>
      <Tag {...args} kind={TagKind.Api}>
        Shipping API
      </Tag>
      <Tag {...args} kind={TagKind.Var}>
        customer_name
      </Tag>
      <Tag {...args} kind={TagKind.Neutral}>
        string
      </Tag>
    </div>
  ),
};

export const MonoOverride: Story = {
  render: (args) => (
    <div className={styles.row}>
      <Tag {...args} kind={TagKind.Kb} mono>
        mono kb
      </Tag>
      <Tag {...args} kind={TagKind.Tool} mono={false}>
        proportional tool
      </Tag>
    </div>
  ),
};
