import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChatSystemMessage } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage';
import { ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.module.scss';

const meta = {
  component: ChatSystemMessage,
  args: { icon: IconName.Hand, text: 'Pavlo took over · 14:05' },
  argTypes: {
    tone: { control: 'select', options: Object.values(ChatSystemMessageTone) },
    icon: { control: 'select', options: Object.values(IconName) },
  },
} satisfies Meta<typeof ChatSystemMessage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TookOver: Story = {};
export const HandedBack: Story = {
  args: { icon: IconName.Agent, text: 'Pavlo handed back to the assistant · 14:10' },
};
export const Closed: Story = {
  args: { icon: IconName.Check, text: 'Chat closed by Pavlo · 14:12' },
};
export const DeliveryFailure: Story = {
  args: {
    tone: ChatSystemMessageTone.Err,
    icon: IconName.Alert,
    text: 'Message not delivered — bot blocked by the user',
  },
};

export const AllEvents: Story = {
  render: () => (
    <div className={styles.storyStack}>
      <ChatSystemMessage icon={IconName.Hand} text="Pavlo took over · 14:05" />
      <ChatSystemMessage icon={IconName.Agent} text="Pavlo handed back to the assistant · 14:10" />
      <ChatSystemMessage icon={IconName.Check} text="Chat closed by Pavlo · 14:12" />
      <ChatSystemMessage
        tone={ChatSystemMessageTone.Err}
        icon={IconName.Alert}
        text="Message not delivered — bot blocked by the user"
      />
    </div>
  ),
};
