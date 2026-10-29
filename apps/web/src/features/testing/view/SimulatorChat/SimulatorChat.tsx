import { Fragment, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChatItemKind,
  ChatSpeaker,
  EVENT_TIME_FORMAT,
} from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ChatEventItem,
  ChatItem,
  ChatMessageItem,
  ChatTurnItem,
} from '@/features/testing/typedefs/simulator.typedefs';
import {
  EVENT_ICONS,
  SPEAKER_BUBBLES,
  TURN_ICON_SIZE,
} from '@/features/testing/view/SimulatorChat/SimulatorChat.constants';
import type { SimulatorChatProps } from '@/features/testing/view/SimulatorChat/SimulatorChat.typedefs';
import { RunTrigger } from '@/shared/api/generated/schema.generated';
import { ChatBubble, ChatBubbleFrom } from '@/shared/ui/chat/ChatBubble';
import { ChatSystemMessage, ChatSystemMessageTone } from '@/shared/ui/chat/ChatSystemMessage';
import { TypingIndicator } from '@/shared/ui/chat/TypingIndicator';
import { Icon, IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/view/SimulatorChat/SimulatorChat.module.scss';

export function SimulatorChat({
  items,
  agentName,
  typing,
  selectedRunId,
  onSelectRun,
  durationLabel,
}: SimulatorChatProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const listRef = useRef<HTMLOListElement>(null);
  const lastItemId = items.at(-1)?.id ?? null;

  useEffect(() => {
    const list = listRef.current;
    if (list !== null) {
      list.scrollTop = list.scrollHeight;
    }
  }, [lastItemId, typing]);

  const turn = (item: ChatTurnItem) => (
    <>
      <button
        type="button"
        className={styles.turn}
        aria-pressed={item.id === selectedRunId}
        onClick={() => onSelectRun(item.id)}
      >
        <Icon name={IconName.Agent} size={TURN_ICON_SIZE} />
        <span className={styles.turnLabel}>
          {item.trigger === RunTrigger.Inactivity && item.attempt !== null
            ? t('chat.followUpTurn', {
                name: agentName,
                attempt: item.attempt,
                count: item.messages.length,
              })
            : t('chat.turn', { name: agentName, count: item.messages.length })}
        </span>
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

  const event = (item: ChatEventItem) => {
    const label =
      item.minutes === null
        ? t(`chat.event.${item.event}`)
        : t('chat.event.silenceFor', { after: durationLabel(item.minutes) });
    return (
      <ChatSystemMessage
        className={styles.event}
        icon={EVENT_ICONS[item.event]}
        text={
          item.at === null
            ? label
            : t('chat.eventAt', {
                event: label,
                at: Date.parse(item.at),
                formatParams: { at: EVENT_TIME_FORMAT },
              })
        }
      />
    );
  };

  const render = (item: ChatItem) => {
    if (item.kind === ChatItemKind.Turn) {
      return turn(item);
    }
    return item.kind === ChatItemKind.Event ? event(item) : line(item);
  };

  return (
    <ol ref={listRef} className={styles.root} aria-label={t('chat.label')}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {render(item)}
        </li>
      ))}
      {typing && (
        <li className={styles.item}>
          <TypingIndicator label={t('chat.typing', { name: agentName })} />
        </li>
      )}
    </ol>
  );
}
