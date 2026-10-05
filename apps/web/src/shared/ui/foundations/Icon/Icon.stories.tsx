import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/foundations/Icon/Icon.module.scss';

const meta = {
  component: Icon,
  args: { name: IconName.Sparkle, size: 18 },
  argTypes: {
    name: { control: 'select', options: Object.values(IconName) },
    size: { control: { type: 'range', min: 11, max: 18, step: 1 } },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Labelled: Story = { args: { name: IconName.Alert, title: 'Warning' } };
export const Spinner: Story = { args: { name: IconName.Spinner } };
export const Logo: Story = { args: { name: IconName.Logo, size: 15, strokeWidth: 1.8 } };
export const AllIcons: Story = {
  render: (args) => (
    <ul className={styles.gallery}>
      {Object.values(IconName).map((name) => (
        <li key={name} className={styles.galleryCell}>
          <Icon {...args} name={name} />
          <span className={styles.galleryLabel}>{name}</span>
        </li>
      ))}
    </ul>
  ),
};
