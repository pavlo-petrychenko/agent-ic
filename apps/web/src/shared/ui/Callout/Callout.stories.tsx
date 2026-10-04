import type { Meta, StoryObj } from '@storybook/react-vite';
import { Callout } from '@/shared/ui/Callout/Callout';
import { CalloutTone } from '@/shared/ui/Callout/Callout.constants';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import styles from '@/shared/ui/Callout/Callout.module.scss';

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
    action: <button type="button">Publish anyway</button>,
  },
};
export const WithLinkAction: Story = {
  args: {
    tone: CalloutTone.Err,
    action: <a href="/">View run trace</a>,
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
