import type { Meta, StoryObj } from '@storybook/react-vite';
import { NavSectionLabel } from '@/shared/ui/navigation/NavSectionLabel/NavSectionLabel';
import styles from '@/shared/ui/navigation/NavSectionLabel/NavSectionLabel.module.scss';

const meta = {
  component: NavSectionLabel,
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
  args: { label: 'Build' },
} satisfies Meta<typeof NavSectionLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const WithAction: Story = {
  args: { label: 'Tools', action: { label: 'New tool', onClick: () => undefined } },
};
