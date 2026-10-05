import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/Button';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { IconButton, IconButtonSize } from '@/shared/ui/IconButton';
import { SelectionBar } from '@/shared/ui/SelectionBar/SelectionBar';
import { SelectionBarVariant } from '@/shared/ui/SelectionBar/SelectionBar.constants';
import styles from '@/shared/ui/SelectionBar/SelectionBar.module.scss';

const meta = {
  component: SelectionBar,
  args: {
    ariaLabel: 'Bulk actions',
    countLabel: '2 selected',
  },
  argTypes: {
    variant: { control: 'select', options: Object.values(SelectionBarVariant) },
  },
} satisfies Meta<typeof SelectionBar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Inline: Story = {
  args: {
    variant: SelectionBarVariant.Inline,
    clearLabel: 'Clear selection',
    onClear: () => undefined,
    actions: (
      <>
        <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} icon={IconName.Pause}>
          Pause
        </Button>
        <Button variant={ButtonVariant.Danger} size={ButtonSize.Sm}>
          Delete
        </Button>
      </>
    ),
  },
  decorators: [
    (Story) => (
      <div className={styles.storyFrame}>
        <Story />
      </div>
    ),
  ],
};

export const Floating: Story = {
  args: {
    variant: SelectionBarVariant.Floating,
    actions: (
      <>
        <IconButton icon={IconName.Copy} label="Duplicate" size={IconButtonSize.Sm} />
        <IconButton icon={IconName.X} label="Delete" size={IconButtonSize.Sm} />
      </>
    ),
  },
};
