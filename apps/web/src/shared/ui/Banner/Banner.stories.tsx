import type { Meta, StoryObj } from '@storybook/react-vite';
import { Banner } from '@/shared/ui/Banner/Banner';
import { BannerTone } from '@/shared/ui/Banner/Banner.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import styles from '@/shared/ui/Banner/Banner.module.scss';

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
  args: {
    tone: BannerTone.Warn,
    children: (
      <>
        Publishing is paused. <a href="/">Review the changes</a> before you continue.
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
