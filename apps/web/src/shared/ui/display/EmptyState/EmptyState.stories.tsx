import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@/shared/ui/actions/Button/Button';
import { EmptyState } from '@/shared/ui/display/EmptyState/EmptyState';
import { EmptyStateTone } from '@/shared/ui/display/EmptyState/EmptyState.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const meta = {
  component: EmptyState,
  args: {
    icon: IconName.Kb,
    title: 'No sources yet',
    description: 'Upload files or connect Google Docs or ClickUp.',
  },
  argTypes: {
    tone: { control: 'select', options: Object.values(EmptyStateTone) },
    icon: { control: 'select', options: Object.values(IconName) },
  },
} satisfies Meta<typeof EmptyState>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Neutral: Story = {
  args: { actions: <Button icon={IconName.Plus}>Add source</Button> },
};
export const Info: Story = {
  args: {
    tone: EmptyStateTone.Info,
    icon: IconName.Send,
    title: 'Check your inbox',
    description: (
      <>
        We sent a confirmation link to <strong>owner@demo-salon.example</strong>.
      </>
    ),
  },
};
export const Ok: Story = {
  args: {
    tone: EmptyStateTone.Ok,
    icon: IconName.Check,
    title: 'Nothing needs you',
    description: 'Escalated chats show up here.',
  },
};
export const Warn: Story = {
  args: { tone: EmptyStateTone.Warn, icon: IconName.Alert, title: 'This link expired' },
};
export const Err: Story = {
  args: { tone: EmptyStateTone.Err, icon: IconName.Esc, title: 'This link is not valid' },
};
