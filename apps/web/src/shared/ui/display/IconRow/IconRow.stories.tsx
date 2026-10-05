import type { Meta, StoryObj } from '@storybook/react-vite';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardPad } from '@/shared/ui/display/Card/Card.constants';
import { IconRow } from '@/shared/ui/display/IconRow/IconRow';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/display/IconRow/IconRow.module.scss';

const meta = {
  component: IconRow,
  args: {
    icon: IconName.Esc,
    tone: NodeKind.Esc,
    label: 'Escalate to a person',
    trailing: '→ yes',
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(NodeKind) },
    icon: { control: 'select', options: Object.values(IconName) },
  },
  decorators: [
    (Story) => (
      <Card pad={CardPad.Sm} className={styles.storyColumn}>
        <Story />
      </Card>
    ),
  ],
} satisfies Meta<typeof IconRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WithTrailing: Story = {};
export const WithoutTrailing: Story = { args: { trailing: null } };
export const Ok: Story = {
  args: { icon: IconName.Check, tone: NodeKind.Ok, label: 'Booking confirmed', trailing: '→ done' },
};
export const Truncated: Story = {
  args: { label: 'A step name that is far too long to fit in a single line of the row' },
};
export const Stack: Story = {
  render: (args) => (
    <>
      <IconRow {...args} />
      <IconRow
        {...args}
        icon={IconName.Kb}
        tone={NodeKind.Kb}
        label="Search knowledge"
        trailing="→ 3 hits"
      />
      <IconRow
        {...args}
        icon={IconName.Send}
        tone={NodeKind.Send}
        label="Send reply"
        trailing={null}
      />
    </>
  ),
};
