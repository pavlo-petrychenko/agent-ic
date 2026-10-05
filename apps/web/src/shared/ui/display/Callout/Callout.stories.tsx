import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/actions/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button/Button.constants';
import { TextLink } from '@/shared/ui/actions/TextLink/TextLink';
import { TextLinkTone } from '@/shared/ui/actions/TextLink/TextLink.constants';
import { Callout } from '@/shared/ui/display/Callout/Callout';
import { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/display/Callout/Callout.module.scss';

const meta = {
  component: Callout,
  args: {
    children: (
      <>
        <strong>Heads up.</strong> Changes to the prompt apply to new conversations only.
      </>
    ),
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(CalloutTone) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {};
export const Info: Story = { args: { tone: CalloutTone.Info } };
export const Warn: Story = { args: { tone: CalloutTone.Warn } };
export const Err: Story = { args: { tone: CalloutTone.Err } };
export const Ok: Story = { args: { tone: CalloutTone.Ok } };
export const WithoutIcon: Story = { args: { icon: null } };
export const WithButtonAction: Story = {
  args: {
    tone: CalloutTone.Warn,
    action: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm}>
        Publish anyway
      </Button>
    ),
  },
};
export const WithLinkAction: Story = {
  decorators: [withMemoryRouter],
  args: {
    tone: CalloutTone.Err,
    action: (
      <TextLink to="/" tone={TextLinkTone.Error}>
        View run trace
      </TextLink>
    ),
  },
};
export const WithRetryAction: Story = {
  args: {
    tone: CalloutTone.Err,
    children: 'The table could not be loaded.',
    action: (
      <Button variant={ButtonVariant.Secondary} size={ButtonSize.Sm} icon={IconName.Refresh}>
        Retry
      </Button>
    ),
  },
};
export const MultiLine: Story = {
  args: {
    tone: CalloutTone.Info,
    children:
      'A longer explanation wraps onto several lines and keeps the icon aligned with the first one. It stays readable at any width because the message column shrinks while the icon holds its size.',
  },
};
export const AllTones: Story = {
  render: (args) => (
    <div className={styles.storyStack}>
      {Object.values(CalloutTone).map((tone) => (
        <Callout key={tone} {...args} tone={tone} />
      ))}
    </div>
  ),
};
