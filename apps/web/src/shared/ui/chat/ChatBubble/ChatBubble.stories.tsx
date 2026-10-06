import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ChatBubble } from '@/shared/ui/chat/ChatBubble/ChatBubble';
import { ChatBubbleFrom, ChatBubbleView } from '@/shared/ui/chat/ChatBubble/ChatBubble.constants';
import { ChatDivider } from '@/shared/ui/chat/ChatDivider/ChatDivider';
import { ChatStatus } from '@/shared/ui/chat/ChatStatus/ChatStatus';
import { ChatSystemMessage } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage';
import { ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage/ChatSystemMessage.constants';
import { Composer } from '@/shared/ui/chat/Composer/Composer';
import { QuickReplies } from '@/shared/ui/chat/QuickReplies/QuickReplies';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator/TypingIndicator';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import styles from '@/shared/ui/chat/ChatBubble/ChatBubble.module.scss';

const QUICK_REPLIES = ['Tomorrow morning', 'This week', 'Talk to a person'];

const meta = {
  component: ChatBubble,
  args: {
    from: ChatBubbleFrom.Customer,
    author: 'Marta',
    time: '14:17',
    children: 'Hi! Can I move my haircut to Friday?',
  },
  argTypes: {
    from: { control: 'select', options: Object.values(ChatBubbleFrom) },
    view: { control: 'select', options: Object.values(ChatBubbleView) },
  },
} satisfies Meta<typeof ChatBubble>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Customer: Story = {};
export const Agent: Story = {
  args: {
    from: ChatBubbleFrom.Agent,
    author: 'Salon assistant',
    children: 'Friday has a free slot at 11:00 or 15:30. Which one suits you?',
  },
};
export const Operator: Story = {
  args: {
    from: ChatBubbleFrom.Operator,
    author: 'Pavlo (you)',
    time: '14:06',
    children: 'I will take it from here.',
  },
};
export const LongMessage: Story = {
  args: {
    children:
      'I booked the haircut for Thursday last week, but my plans changed and I will be travelling until Saturday, so I would like to move it to the next free Friday slot if that is possible.',
  },
};
export const WithoutMeta: Story = { args: { author: null, time: null } };

export const WidgetBubbles: Story = {
  render: () => (
    <div className={styles.storyWidget}>
      <ChatBubble
        from={ChatBubbleFrom.Agent}
        author={null}
        time={null}
        view={ChatBubbleView.Widget}
      >
        Hi! I am the salon assistant. How can I help?
      </ChatBubble>
      <ChatBubble
        from={ChatBubbleFrom.Customer}
        author={null}
        time={null}
        view={ChatBubbleView.Widget}
      >
        Can I move my haircut to Friday?
      </ChatBubble>
    </div>
  ),
};

function ThreadDemo() {
  const [draft, setDraft] = useState('');
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <div className={styles.storyThread} role="log" aria-label="Conversation with Marta">
      <ChatBubble from={ChatBubbleFrom.Customer} author="Marta" time="14:17">
        Hi! Can I move my haircut to Friday?
      </ChatBubble>
      <ChatBubble from={ChatBubbleFrom.Agent} author="Salon assistant" time="14:17">
        Friday has a free slot at 11:00 or 15:30. Which one suits you?
      </ChatBubble>
      <QuickReplies
        label="Suggested replies"
        options={QUICK_REPLIES}
        chosen={chosen}
        onChoose={setChosen}
      />
      <ChatDivider text="Flow paused since 14:03" icon={IconName.Pause} />
      <ChatSystemMessage icon={IconName.Hand} text="Pavlo took over · 14:05" />
      <ChatBubble from={ChatBubbleFrom.Operator} author="Pavlo (you)" time="14:06">
        I will take it from here.
      </ChatBubble>
      <ChatSystemMessage
        tone={ChatSystemMessageTone.Err}
        icon={IconName.Alert}
        text="Message not delivered — bot blocked by the user"
      />
      <ChatSystemMessage icon={IconName.Agent} text="Pavlo handed back to the assistant · 14:10" />
      <ChatStatus
        icon={IconName.ToolEvent}
        text="Tool event run is writing the confirmation…"
        inProgress
      />
      <TypingIndicator label="Salon assistant is typing…" />
      <ChatSystemMessage icon={IconName.Check} text="Chat closed by Pavlo · 14:12" />
      <Composer
        value={draft}
        onChange={setDraft}
        onSend={() => {
          setDraft('');
        }}
        onRetry={null}
        placeholder="Write a message…"
        label="Reply"
        sendLabel="Send"
        retryLabel="Retry"
      />
    </div>
  );
}

export const Thread: Story = {
  parameters: { layout: 'padded' },
  render: () => <ThreadDemo />,
};
