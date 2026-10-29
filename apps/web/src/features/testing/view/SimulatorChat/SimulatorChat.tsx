import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import { ChatItemKind, ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ChatDividerItem,
  ChatItem,
  ChatMessageItem,
  ChatTurnItem,
} from '@/features/testing/typedefs/simulator.typedefs';
import {
  DIVIDER_ICONS,
  SPEAKER_BUBBLES,
  TURN_ICON_SIZE,
} from '@/features/testing/view/SimulatorChat/SimulatorChat.constants';
import type { SimulatorChatProps } from '@/features/testing/view/SimulatorChat/SimulatorChat.typedefs';
import { ChatBubble, ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { ChatDivider } from '@/shared/ui/chat/ChatDivider';
import { ChatSystemMessage, ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/SimulatorChat/SimulatorChat.module.scss';

export function SimulatorChat({
  items,
  agentName,
  typing,
  ended,
  selectedRunId,
  onSelectRun,
}: SimulatorChatProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);

  const turn = (item: ChatTurnItem) => (
    <>
      <button
        type="button"
        className={styles.turn}
        aria-pressed={item.id === selectedRunId}
        onClick={() => onSelectRun(item.id)}
      >
        <Icon name={IconName.Agent} size={TURN_ICON_SIZE} />
        {t('chat.turn', { name: agentName, count: item.messages.length })}
      </button>
      {item.messages.map((message, index) => (
        <Fragment key={message.id}>
          {item.escalated && index === item.messages.length - item.escalationMessageCount && (
            <span className={styles.label}>{t('chat.escalationMessage')}</span>
          )}
          <ChatBubble from={ChatBubbleFrom.Agent} author={null} time={null}>
            {message.text}
          </ChatBubble>
        </Fragment>
      ))}
      {item.failed && (
        <ChatSystemMessage
          tone={ChatSystemMessageTone.Err}
          icon={IconName.Alert}
          text={item.errorMessage ?? t('chat.failed')}
        />
      )}
    </>
  );

  const authors: Readonly<Record<ChatSpeaker, string | null>> = {
    [ChatSpeaker.User]: t('chat.you'),
    [ChatSpeaker.Agent]: null,
    [ChatSpeaker.Operator]: t('chat.operator'),
    [ChatSpeaker.System]: null,
  };

  const line = (item: ChatMessageItem) => {
    const from = SPEAKER_BUBBLES[item.speaker];
    return from === null ? (
      <ChatSystemMessage icon={IconName.Info} text={item.text} />
    ) : (
      <ChatBubble from={from} author={authors[item.speaker]} time={null}>
        {item.text}
      </ChatBubble>
    );
  };

  const divider = (item: ChatDividerItem) => (
    <ChatDivider icon={DIVIDER_ICONS[item.divider]} text={t(`chat.divider.${item.divider}`)} />
  );

  const render = (item: ChatItem) => {
    if (item.kind === ChatItemKind.Turn) {
      return turn(item);
    }
    return item.kind === ChatItemKind.Divider ? divider(item) : line(item);
  };

  return (
    <ol className={styles.root} aria-label={t('chat.label')}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {render(item)}
        </li>
      ))}
      {ended && (
        <li className={styles.item}>
          <ChatSystemMessage icon={IconName.Check} text={t('chat.ended', { name: agentName })} />
        </li>
      )}
      {typing && (
        <li className={styles.item}>
          <TypingIndicator label={t('chat.typing', { name: agentName })} />
        </li>
      )}
    </ol>
  );
}
