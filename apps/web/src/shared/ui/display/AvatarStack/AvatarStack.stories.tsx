import type { Meta, StoryObj } from '@storybook/react-vite';
import { AvatarTone } from '@/shared/ui/display/Avatar/Avatar.constants';
import { AvatarStack } from '@/shared/ui/display/AvatarStack/AvatarStack';
import { StatusKind } from '@/shared/ui/display/StatusDot/StatusDot.constants';
import styles from '@/shared/ui/display/AvatarStack/AvatarStack.module.scss';

const meta = {
  component: AvatarStack,
  args: {
    max: 3,
    avatars: [
      { initials: 'AB', name: 'Ada Byron' },
      { initials: 'CD', name: 'Cy Dunn', tone: AvatarTone.Accent },
      { initials: 'EF', name: 'Eli Fox', tone: AvatarTone.Solid },
      { initials: 'GH', name: 'Gus Hale' },
      { initials: 'IJ', name: 'Ida Jones' },
    ],
  },
} satisfies Meta<typeof AvatarStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Fits: Story = { args: { max: 5 } };
export const WithStatus: Story = {
  args: {
    avatars: [
      { initials: 'AB', name: 'Ada Byron', status: StatusKind.Ok },
      { initials: 'CD', name: 'Cy Dunn', status: StatusKind.Idle },
      { initials: 'EF', name: 'Eli Fox' },
    ],
  },
};
export const AllMaximums: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {[1, 2, 3, 5].map((max) => (
        <AvatarStack key={max} {...args} max={max} />
      ))}
    </div>
  ),
};
