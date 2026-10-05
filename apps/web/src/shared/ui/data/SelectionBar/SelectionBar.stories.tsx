import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { IconButton, IconButtonSize } from '@/shared/ui/actions/IconButton';
import { SelectionBar } from '@/shared/ui/data/SelectionBar/SelectionBar';
import { SelectionBarVariant } from '@/shared/ui/data/SelectionBar/SelectionBar.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/data/SelectionBar/SelectionBar.module.scss';

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
