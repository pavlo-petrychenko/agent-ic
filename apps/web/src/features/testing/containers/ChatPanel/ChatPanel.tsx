import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposerMode } from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ChatFailure,
  ChatPanelProps,
} from '@/features/testing/containers/ChatPanel/ChatPanel.typedefs';
import {
  composerMode,
  isActiveRun,
  toChatItems,
} from '@/features/testing/logic/helpers/chat.helpers';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat';
import { SimulatorSetup } from '@/features/testing/view/SimulatorSetup';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
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
  onRestart,
  ...setup
}: ChatPanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const errorMessage = useErrorMessage();
  const [text, setText] = useState('');
  const [failure, setFailure] = useState<ChatFailure | null>(null);
  const [takenOver, setTakenOver] = useState<string | null>(null);
  const { conversation } = simulator;
  const items = useMemo(
    () =>
      conversation === null
        ? []
        : toChatItems(conversation.messages, conversation.runs, conversation.state),
    [conversation],
  );
  const mode =
    conversation === null
      ? ComposerMode.User
      : composerMode(conversation.state, takenOver === conversation.conversationId);
  const operator = mode === ComposerMode.Operator;
  const failed = failure?.mode === mode ? failure : null;

  const attempt = async (action: () => Promise<void>): Promise<void> => {
    setFailure(null);
    try {
      await action();
    } catch (error) {
      setFailure({ mode, message: errorMessage(toAppError(error)), retry: action });
    }
  };

  const send = () => {
    const message = text.trim();
    return attempt(async () => {
      await (operator ? simulator.reply(message) : simulator.send(message));
      setText('');
    });
  };

  const handBack = () =>
    attempt(async () => {
      await simulator.handBack();
      setTakenOver(null);
    });

  const state = () => {
    if (simulator.failed) {
      return (
        <EmptyState
          icon={IconName.Alert}
          tone={EmptyStateTone.Err}
          title={t(simulator.loadFailed ? 'conversationError' : 'startError')}
          actions={
            <Button variant={ButtonVariant.Secondary} onClick={simulator.retry}>
              {t('retry')}
            </Button>
          }
        />
      );
    }
    if (conversation === null) {
      return <Skeleton label={t('loading')} />;
    }
    if (items.length === 0) {
      return (
        <EmptyState
          icon={IconName.Msg}
          title={t('chat.emptyTitle')}
          description={t('chat.emptyDescription')}
        />
      );
    }
    return null;
  };

  const notReady = state();

  return (
    <section className={styles.root} aria-label={t('chat.label')}>
      <div className={styles.setup}>
        <SimulatorSetup {...setup} />
      </div>
      {notReady === null ? (
        <SimulatorChat
          items={items}
          agentName={agentName}
          typing={conversation?.runs.some(isActiveRun) ?? false}
          ended={mode === ComposerMode.Ended}
          selectedRunId={selectedRunId}
          onSelectRun={onSelectRun}
        />
      ) : (
        <div className={styles.state}>{notReady}</div>
      )}
      {mode === ComposerMode.Ended && (
        <div className={styles.footer}>
          <Button
            className={styles.action}
            variant={ButtonVariant.Secondary}
            icon={IconName.Refresh}
            loading={simulator.restarting}
            onClick={onRestart}
          >
            {t('ended.restart')}
          </Button>
          <p className={styles.hint}>{t('ended.hint')}</p>
        </div>
      )}
      {mode === ComposerMode.Escalated && (
        <div className={styles.footer}>
          <Button
            className={styles.action}
            variant={ButtonVariant.Secondary}
            icon={IconName.Hand}
            onClick={() => setTakenOver(conversation?.conversationId ?? null)}
          >
            {t('operator.reply')}
          </Button>
          <p className={styles.hint}>{t('operator.hint')}</p>
        </div>
      )}
      {(mode === ComposerMode.User || operator) && (
        <div className={styles.footer}>
          {operator && (
            <div className={styles.operator}>
              <span className={styles.mode}>{t('operator.reply')}</span>
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                icon={IconName.Agent}
                loading={simulator.handingBack}
                disabled={simulator.replying}
                onClick={() => void handBack()}
              >
                {t('operator.handBack')}
              </Button>
            </div>
          )}
          <Composer
            value={text}
            onChange={setText}
            onSend={() => void send()}
            onRetry={failed === null ? null : () => void attempt(failed.retry)}
            placeholder={t(operator ? 'operator.placeholder' : 'composer.placeholder')}
            label={t(operator ? 'operator.reply' : 'composer.label')}
            sendLabel={t('composer.send')}
            retryLabel={t('retry')}
            sending={operator ? simulator.replying : simulator.sending}
            error={failed?.message ?? null}
            disabled={conversation === null}
          />
        </div>
      )}
    </section>
  );
}
