import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { WidgetLauncher } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher';
import type { WidgetLauncherProps } from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher.typedefs';
import styles from '@/shared/ui/chat/WidgetLauncher/WidgetLauncher.module.scss';

const TEAL = '#0f6b6b';
const BLUE = '#2f5bd3';
const VIOLET = '#6d4fb3';

const meta = {
  component: WidgetLauncher,
  args: { accent: TEAL, open: false, onToggle: () => undefined, label: 'Open chat' },
  decorators: [
    (Story) => (
      <div className={styles.storyStage}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof WidgetLauncher>;

export default meta;

type Story = StoryObj<typeof meta>;

function ToggleLauncher(props: WidgetLauncherProps) {
  const [open, setOpen] = useState(props.open);

  return (
    <WidgetLauncher
      {...props}
      open={open}
      label={open ? 'Close chat' : 'Open chat'}
      onToggle={() => {
        setOpen((current) => !current);
      }}
    />
  );
}

export const Closed: Story = {};
export const Open: Story = { args: { open: true, label: 'Close chat' } };
export const Focused: Story = {
  play: async ({ canvasElement }) => {
    canvasElement.querySelector('button')?.focus();
  },
};
export const Interactive: Story = { render: (args) => <ToggleLauncher {...args} /> };
export const CustomerBlue: Story = { args: { accent: BLUE } };
export const CustomerViolet: Story = { args: { accent: VIOLET } };
