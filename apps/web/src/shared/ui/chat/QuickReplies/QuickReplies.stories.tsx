import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { QuickReplies } from '@/shared/ui/chat/QuickReplies/QuickReplies';
import type { QuickRepliesProps } from '@/shared/ui/chat/QuickReplies/QuickReplies.typedefs';
import styles from '@/shared/ui/chat/QuickReplies/QuickReplies.module.scss';

const OPTIONS = ['Tomorrow morning', 'This week', 'Talk to a person'];
const WIDGET_ACCENT = '#2f5bd3';

const meta = {
  component: QuickReplies,
  args: {
    label: 'Suggested replies',
    options: OPTIONS,
    chosen: null,
    onChoose: () => undefined,
  },
} satisfies Meta<typeof QuickReplies>;

export default meta;

type Story = StoryObj<typeof meta>;

function InteractiveReplies(props: QuickRepliesProps) {
  const [chosen, setChosen] = useState<string | null>(props.chosen);

  return <QuickReplies {...props} chosen={chosen} onChoose={setChosen} />;
}

export const Default: Story = {};
export const Interactive: Story = { render: (args) => <InteractiveReplies {...args} /> };
export const Chosen: Story = { args: { chosen: 'This week' } };
export const Disabled: Story = { args: { disabled: true } };
export const DisabledAfterChoice: Story = { args: { chosen: 'This week', disabled: true } };
export const WidgetAccent: Story = { args: { chosen: 'This week', accent: WIDGET_ACCENT } };
export const WidgetAccentDefault: Story = { args: { accent: WIDGET_ACCENT } };

export const AllStates: Story = {
  render: (args) => (
    <div className={styles.storyStack}>
      <QuickReplies {...args} />
      <QuickReplies {...args} chosen="This week" />
      <QuickReplies {...args} disabled />
      <QuickReplies {...args} chosen="This week" accent={WIDGET_ACCENT} />
    </div>
  ),
};
