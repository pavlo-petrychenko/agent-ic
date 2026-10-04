import type { Meta, StoryObj } from '@storybook/react-vite';
import { Avatar } from '@/shared/ui/Avatar/Avatar';
import { AvatarSize, AvatarTone } from '@/shared/ui/Avatar/Avatar.constants';
import styles from '@/shared/ui/Avatar/Avatar.module.scss';

const IMAGE_SRC =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><rect width="8" height="4" fill="%230f6b6b"/><rect y="4" width="8" height="4" fill="%23c27b1a"/></svg>';

const meta = {
  component: Avatar,
  args: { initials: 'PP', name: 'Pavlo Petrenko' },
  argTypes: {
    size: { control: 'select', options: Object.values(AvatarSize) },
    tone: { control: 'select', options: Object.values(AvatarTone) },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Accent: Story = { args: { tone: AvatarTone.Accent } };
export const Solid: Story = { args: { tone: AvatarTone.Solid } };
export const Image: Story = { args: { src: IMAGE_SRC } };
export const BrokenImageFallsBackToInitials: Story = {
  args: { src: 'data:image/png;base64,broken' },
};
export const DecorativeBesideAName: Story = { args: { name: null } };
export const AllSizesAndTones: Story = {
  render: (args) => (
    <div className={styles.storyRow}>
      {Object.values(AvatarTone).flatMap((tone) =>
        Object.values(AvatarSize).map((size) => (
          <Avatar key={`${tone}-${size}`} {...args} tone={tone} size={size} />
        )),
      )}
    </div>
  ),
};
