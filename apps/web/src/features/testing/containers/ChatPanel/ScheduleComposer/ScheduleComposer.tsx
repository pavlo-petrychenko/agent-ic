import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TESTING_NAMESPACE } from '@/features/testing/constants/testingI18n.constants';
import type {
  ScheduleComposerProps,
  ScheduleFailure,
} from '@/features/testing/containers/ChatPanel/ScheduleComposer/ScheduleComposer.typedefs';
import { isActiveRun } from '@/features/testing/logic/helpers/chat.helpers';
import type { ScheduleTrigger } from '@/features/testing/typedefs/schedule.typedefs';
import type { ScheduleCheck } from '@/features/testing/typedefs/simulator.typedefs';
import { RunSchedule } from '@/features/testing/view/RunSchedule';
import {
  ConversationState,
  MessageAuthor,
  ScheduleConditionKind,
} from '@/shared/api/generated/schema.generated';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import styles from '@/features/testing/containers/ChatPanel/ScheduleComposer/ScheduleComposer.module.scss';

export function ScheduleComposer({
  triggers,
  conversation,
  simulator,
  latest,
  onRan,
}: ScheduleComposerProps) {
  const { t } = useTranslation(TESTING_NAMESPACE);
  const errorMessage = useErrorMessage();
  const [picked, setPicked] = useState<string | null>(null);
  const [failure, setFailure] = useState<ScheduleFailure | null>(null);
  const { conversationId } = conversation;
  const selected = triggers.find((trigger) => trigger.id === picked) ?? triggers.at(0) ?? null;

  const disabledReason = () => {
    if (conversation.state !== ConversationState.AgentActive) {
      return t('schedule.notActive');
    }
    if (!conversation.messages.some((message) => message.author === MessageAuthor.Customer)) {
      return t('schedule.needsCustomer');
    }
    return conversation.runs.some(isActiveRun) ? t('schedule.busy') : null;
  };

  const checkLabel = ({ kind }: ScheduleCheck, trigger: ScheduleTrigger): string =>
    kind === ScheduleConditionKind.SilentFor && trigger.silentForHours !== null
      ? t('schedule.check.silentForHours', { hours: trigger.silentForHours })
      : t(`schedule.check.${kind}`);

  const run = async (trigger: ScheduleTrigger) => {
    setFailure(null);
    try {
      const result = await simulator.runSchedule(trigger.id);
      if (result !== null) {
        onRan(result);
      }
    } catch (error) {
      setFailure({ conversationId, message: errorMessage(toAppError(error)) });
    }
  };

  if (selected === null) {
    return null;
  }

  return (
    <>
      <RunSchedule
        options={triggers}
        selectedId={selected.id}
        onSelect={setPicked}
        checks={
          latest?.nodeId === selected.id
            ? latest.checks.map((check) => ({
                id: check.kind,
                label: checkLabel(check, selected),
                met: check.met,
              }))
            : []
        }
        loading={simulator.runningSchedule}
        disabledReason={disabledReason()}
        error={failure?.conversationId === conversationId ? failure.message : null}
        onRun={() => void run(selected)}
      />
      <p className={styles.hint}>{t('schedule.switchHint')}</p>
    </>
  );
}
