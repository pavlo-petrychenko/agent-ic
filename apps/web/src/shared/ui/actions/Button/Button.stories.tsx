import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/actions/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button/Button.constants';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/shared/ui/actions/Button/Button.module.scss';

const meta = {
  component: Button,
  args: { children: 'Save changes' },
  argTypes: {
    variant: { control: 'select', options: Object.values(ButtonVariant) },
    size: { control: 'select', options: Object.values(ButtonSize) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

const VARIANTS = Object.values(ButtonVariant);
const SIZES = Object.values(ButtonSize);

export const Primary: Story = { args: { variant: ButtonVariant.Primary } };
export const Secondary: Story = { args: { variant: ButtonVariant.Secondary } };
export const Danger: Story = { args: { variant: ButtonVariant.Danger, children: 'Delete agent' } };
export const Ghost: Story = { args: { variant: ButtonVariant.Ghost, children: 'Edit prompt' } };
export const Small: Story = { args: { size: ButtonSize.Sm } };
export const Large: Story = { args: { size: ButtonSize.Lg } };
export const WithIcon: Story = { args: { icon: IconName.Plus, children: 'Add source' } };
export const FullWidth: Story = {
  args: { fullWidth: true, size: ButtonSize.Lg },
  decorators: [
    (Story) => (
      <div className={styles.storyWide}>
        <Story />
      </div>
    ),
  ],
};
export const LoadingSecondary: Story = {
  args: { variant: ButtonVariant.Secondary, loading: true, children: 'Saving…' },
};
export const LoadingDanger: Story = {
  args: { variant: ButtonVariant.Danger, loading: true, children: 'Deleting…' },
};
export const Loading: Story = { args: { loading: true } };
export const LoadingWithIcon: Story = { args: { loading: true, icon: IconName.Plus } };
export const Disabled: Story = { args: { disabled: true } };
export const AsLink: Story = { args: { href: '/docs', children: 'Open docs' } };
export const DisabledLink: Story = {
  args: { href: '/docs', disabled: true, children: 'Open docs' },
};

export const AllVariantsAndSizes: Story = {
  render: () => (
    <div className={styles.storyStack}>
      {VARIANTS.map((variant) => (
        <div key={variant} className={styles.storyRow}>
          {SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {`${variant} ${size}`}
            </Button>
          ))}
          <Button variant={variant} disabled>
            Disabled
          </Button>
          {variant === ButtonVariant.Ghost ? null : (
            <Button variant={variant} loading>
              Loading
            </Button>
          )}
        </div>
      ))}
    </div>
  ),
};
