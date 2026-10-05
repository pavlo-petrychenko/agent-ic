import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextLink } from '@/shared/ui/actions/TextLink/TextLink';
import { Banner } from '@/shared/ui/display/Banner/Banner';
import { BannerTone } from '@/shared/ui/display/Banner/Banner.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/display/Banner/Banner.module.scss';

const meta = {
  component: Banner,
  args: { children: 'An operator has taken over this conversation. The agent is paused.' },
  argTypes: {
    tone: { control: 'select', options: Object.values(BannerTone) },
    icon: { control: 'select', options: [null, ...Object.values(IconName)] },
  },
} satisfies Meta<typeof Banner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Info: Story = {};
export const Warn: Story = {
  args: { tone: BannerTone.Warn, children: 'You have unpublished changes.' },
};
export const Err: Story = {
  args: { tone: BannerTone.Err, children: 'The Telegram channel is disconnected.' },
};
export const WithoutIcon: Story = { args: { icon: null } };
export const WithLink: Story = {
  decorators: [withMemoryRouter],
  args: {
    tone: BannerTone.Warn,
    children: (
      <>
        Publishing is paused.{' '}
        <TextLink to="/" inline>
          Review the changes
        </TextLink>{' '}
        before you continue.
      </>
    ),
  },
};
export const AllTones: Story = {
  render: (args) => (
    <div className={styles.storyStack}>
      {Object.values(BannerTone).map((tone) => (
        <Banner key={tone} {...args} tone={tone}>
          {tone}: the state of the whole pane.
        </Banner>
      ))}
    </div>
  ),
};
