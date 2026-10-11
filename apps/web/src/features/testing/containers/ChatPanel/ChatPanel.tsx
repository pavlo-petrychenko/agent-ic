import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type { ChatPanelProps } from '@/features/testing/containers/ChatPanel/ChatPanel.typedefs';
import { isActiveRun, toChatItems } from '@/features/testing/logic/helpers/chat.helpers';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat';
import { SimulatorSetup } from '@/features/testing/view/SimulatorSetup';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Composer } from '@/shared/ui/chat/Composer';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/containers/ChatPanel/ChatPanel.module.scss';

export function ChatPanel({
  agentName,
  simulator,
  selectedRunId,
  onSelectRun,
  ...setup
}: ChatPanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const errorMessage = useErrorMessage();
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const { conversation } = simulator;
  const items = useMemo(
    () => (conversation === null ? [] : toChatItems(conversation.messages, conversation.runs)),
    [conversation],
  );

  const send = async () => {
    setSendError(null);
    try {
      await simulator.send(text.trim());
      setText('');
    } catch (error) {
      setSendError(errorMessage(toAppError(error)));
    }
  };

  const chat = () => {
    if (simulator.failed) {
      return (
        <div className={styles.state}>
          <EmptyState
            icon={IconName.Alert}
            tone={EmptyStateTone.Err}
            title={t('startError')}
            actions={
              <Button variant={ButtonVariant.Secondary} onClick={simulator.retry}>
                {t('retry')}
              </Button>
            }
          />
        </div>
      );
    }
    if (conversation === null) {
      return (
        <div className={styles.state}>
          <Skeleton label={t('loading')} />
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className={styles.state}>
          <EmptyState
            icon={IconName.Msg}
            title={t('chat.emptyTitle')}
            description={t('chat.emptyDescription')}
          />
        </div>
      );
    }
    return (
      <SimulatorChat
        items={items}
        agentName={agentName}
        typing={conversation.runs.some(isActiveRun)}
        selectedRunId={selectedRunId}
        onSelectRun={onSelectRun}
      />
    );
  };

  return (
    <section className={styles.root} aria-label={t('chat.label')}>
      <div className={styles.setup}>
        <SimulatorSetup {...setup} />
      </div>
      {chat()}
      <Composer
        className={styles.composer}
        value={text}
        onChange={setText}
        onSend={() => void send()}
        onRetry={sendError === null ? null : () => void send()}
        placeholder={t('composer.placeholder')}
        label={t('composer.label')}
        sendLabel={t('composer.send')}
        retryLabel={t('retry')}
        sending={simulator.sending}
        error={sendError}
        disabled={conversation === null}
      />
    </section>
  );
}
