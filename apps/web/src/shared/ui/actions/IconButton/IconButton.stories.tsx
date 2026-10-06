import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/actions/IconButton/IconButton.constants';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/shared/ui/actions/IconButton/IconButton.module.scss';

const meta = {
  component: IconButton,
  args: { icon: IconName.More, label: 'More actions' },
  argTypes: {
    icon: { control: 'select', options: Object.values(IconName) },
    variant: { control: 'select', options: Object.values(IconButtonVariant) },
    size: { control: 'select', options: Object.values(IconButtonSize) },
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

const VARIANTS = Object.values(IconButtonVariant);
const SIZES = Object.values(IconButtonSize);

export const Ghost: Story = { args: { variant: IconButtonVariant.Ghost } };
export const Secondary: Story = { args: { variant: IconButtonVariant.Secondary } };
export const Primary: Story = { args: { variant: IconButtonVariant.Primary, icon: IconName.Send } };
export const ExtraSmall: Story = {
  args: { size: IconButtonSize.Xs, icon: IconName.X, label: 'Clear' },
};
export const Small: Story = { args: { size: IconButtonSize.Sm } };
export const Large: Story = { args: { size: IconButtonSize.Lg } };
export const Loading: Story = { args: { loading: true } };
export const Disabled: Story = { args: { disabled: true } };
export const AsLink: Story = {
  args: { href: '/next', icon: IconName.ChevronRight, label: 'Open' },
};

export const AllVariantsAndSizes: Story = {
  render: () => (
    <div className={styles.storyStack}>
      {VARIANTS.map((variant) => (
        <div key={variant} className={styles.storyRow}>
          {SIZES.filter(
            (size) => variant === IconButtonVariant.Ghost || size !== IconButtonSize.Xs,
          ).map((size) => (
            <IconButton
              key={size}
              icon={IconName.Plus}
              label={`${variant} ${size}`}
              variant={variant}
              size={size}
            />
          ))}
          <IconButton
            icon={IconName.Plus}
            label={`${variant} disabled`}
            variant={variant}
            disabled
          />
        </div>
      ))}
    </div>
  ),
};
