import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposerMode, WRITE_AS_MODES } from '@/features/testing/constants/simulator.constants';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ChatFailure,
  ChatPanelProps,
  InactivityFailure,
  PickedWriteAs,
} from '@/features/testing/containers/ChatPanel/ChatPanel.typedefs';
import {
  canWriteAsOperator,
  composerMode,
  isActiveRun,
  toChatItems,
} from '@/features/testing/logic/helpers/chat.helpers';
import { nextInactivity } from '@/features/testing/logic/helpers/inactivity.helpers';
import { formatMinutes } from '@/features/testing/logic/helpers/output.helpers';
import { SimulateInactivity } from '@/features/testing/view/SimulateInactivity';
import { SimulatorChat } from '@/features/testing/view/SimulatorChat';
import { SimulatorSetup } from '@/features/testing/view/SimulatorSetup';
import {
  ConversationCloseReason,
  ConversationState,
} from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { useLocale } from '@/shared/i18n/hooks/useLocale';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/actions/SegmentedControl';
import { Composer } from '@/shared/ui/chat/Composer';
import { EmptyState, EmptyStateTone } from '@/shared/ui/display/EmptyState';
import { Skeleton } from '@/shared/ui/display/Skeleton';
import { IconName } from '@/shared/ui/foundations/Icon';
import styles from '@/features/testing/containers/ChatPanel/ChatPanel.module.scss';

export function ChatPanel({
  agentName,
  flow,
  simulator,
  selectedRunId,
  onSelectRun,
  onRestart,
  ...setup
}: ChatPanelProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const { locale } = useLocale();
  const errorMessage = useErrorMessage();
  const [text, setText] = useState('');
  const [failure, setFailure] = useState<ChatFailure | null>(null);
  const [picked, setPicked] = useState<PickedWriteAs | null>(null);
  const [inactivityFailure, setInactivityFailure] = useState<InactivityFailure | null>(null);
  const { conversation } = simulator;
  const items = useMemo(
    () => (conversation === null ? [] : toChatItems(conversation)),
    [conversation],
  );
  const conversationId = conversation?.conversationId ?? null;
  const pickedMode = picked?.conversationId === conversationId ? (picked?.mode ?? null) : null;
  const mode =
    conversation === null ? ComposerMode.User : composerMode(conversation.state, pickedMode);
  const inactivityError =
    inactivityFailure?.conversationId === conversationId ? inactivityFailure.message : null;
  const operator = mode === ComposerMode.Operator;
  const switchable = conversation !== null && canWriteAsOperator(conversation.state);
  const failed = failure?.mode === mode ? failure : null;
  const running = conversation?.runs.some(isActiveRun) ?? false;
  const next = nextInactivity(flow);
  const inactivity =
    next !== null &&
    conversation?.state === ConversationState.AgentActive &&
    conversation.messages.length > 0
      ? next
      : null;

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
      setPicked(null);
    });

  const simulateInactivity = async (id: string) => {
    setInactivityFailure(null);
    try {
      await simulator.closeForInactivity();
    } catch (error) {
      setInactivityFailure({ conversationId: id, message: errorMessage(toAppError(error)) });
    }
  };

  const composerHint = () => {
    if (operator) {
      return t('operator.hint');
    }
    return t(
      conversation?.state === ConversationState.Handled
        ? 'composer.handledHint'
        : 'composer.waitingHint',
    );
  };

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
          typing={running}
          selectedRunId={selectedRunId}
          onSelectRun={onSelectRun}
        />
      ) : (
        <div className={styles.state}>{notReady}</div>
      )}
      {mode === ComposerMode.Ended ? (
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
          <p className={styles.hint}>
            {t(
              conversation?.closeReason === ConversationCloseReason.Inactivity
                ? 'ended.inactiveHint'
                : 'ended.hint',
            )}
          </p>
        </div>
      ) : (
        <div className={styles.footer}>
          {switchable && (
            <>
              <div className={styles.writeAs}>
                <span className={styles.mode}>{t('composer.writeAs')}</span>
                <SegmentedControl
                  ariaLabel={t('composer.writeAs')}
                  size={SegmentedControlSize.Sm}
                  options={WRITE_AS_MODES.map((value) => ({
                    value,
                    label: t(`composer.as.${value}`),
                  }))}
                  value={operator ? ComposerMode.Operator : ComposerMode.User}
                  onValueChange={(value) =>
                    conversationId !== null && setPicked({ conversationId, mode: value })
                  }
                />
              </div>
              <p className={styles.hint}>{composerHint()}</p>
            </>
          )}
          {inactivity !== null && conversationId !== null && (
            <SimulateInactivity
              hint={t('inactivity.next.autoClose', {
                after: formatMinutes(inactivity.afterMinutes, locale),
              })}
              loading={simulator.closingInactive}
              disabled={running || simulator.sending}
              error={inactivityError}
              onSimulate={() => void simulateInactivity(conversationId)}
            />
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
          {operator && (
            <Button
              className={styles.action}
              variant={ButtonVariant.Secondary}
              size={ButtonSize.Sm}
              icon={IconName.Agent}
              loading={simulator.handingBack}
              disabled={simulator.replying}
              onClick={() => void handBack()}
            >
              {t('operator.handBack')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
