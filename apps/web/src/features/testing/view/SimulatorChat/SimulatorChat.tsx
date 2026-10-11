import { useTranslation } from 'react-i18next';
import { ChatItemKind, ChatSpeaker } from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { ChatTurnItem } from '@/features/testing/typedefs/simulator.typedefs';
import { TURN_ICON_SIZE } from '@/features/testing/view/SimulatorChat/SimulatorChat.constants';
import type { SimulatorChatProps } from '@/features/testing/view/SimulatorChat/SimulatorChat.typedefs';
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
      {item.messages.map((message) => (
        <ChatBubble key={message.id} from={ChatBubbleFrom.Agent} author={null} time={null}>
          {message.text}
        </ChatBubble>
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

  return (
    <ol className={styles.root} aria-label={t('chat.label')}>
      {items.map((item) => (
        <li key={item.id} className={styles.item}>
          {item.kind === ChatItemKind.Turn ? (
            turn(item)
          ) : item.speaker === ChatSpeaker.System ? (
            <ChatSystemMessage icon={IconName.Info} text={item.text} />
          ) : (
            <ChatBubble
              from={
                item.speaker === ChatSpeaker.Operator
                  ? ChatBubbleFrom.Operator
                  : ChatBubbleFrom.Customer
              }
              author={item.speaker === ChatSpeaker.Operator ? t('chat.operator') : t('chat.you')}
              time={null}
            >
              {item.text}
            </ChatBubble>
          )}
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
