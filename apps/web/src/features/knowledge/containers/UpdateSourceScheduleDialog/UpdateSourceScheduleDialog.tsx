import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateKnowledgeSourceSchedule } from '@/features/knowledge/communication/hooks/useUpdateKnowledgeSourceSchedule';
import { KNOWLEDGE_NAMESPACE } from '@/features/knowledge/constants/knowledgeI18n.constants';
import type { UpdateSourceScheduleDialogProps } from '@/features/knowledge/containers/UpdateSourceScheduleDialog/UpdateSourceScheduleDialog.typedefs';
import {
  knowledgeScheduleInput,
  knowledgeScheduleOf,
} from '@/features/knowledge/logic/helpers/knowledgeSource.helpers';
import type { KnowledgeSourceSchedule } from '@/features/knowledge/typedefs/knowledgeSource.typedefs';
import { SourceScheduleModal } from '@/features/knowledge/view/SourceScheduleModal';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function UpdateSourceScheduleDialog({
  knowledgeBaseId,
  source,
  onClose,
}: UpdateSourceScheduleDialogProps) {
  const { t } = useTranslation(KNOWLEDGE_NAMESPACE);
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { updateKnowledgeSourceSchedule, updating } = useUpdateKnowledgeSourceSchedule(
    knowledgeBaseId,
    source.id,
  );
  const [schedule, setSchedule] = useState<KnowledgeSourceSchedule>(() =>
    knowledgeScheduleOf(source),
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    const input = knowledgeScheduleInput(schedule);
    try {
      await updateKnowledgeSourceSchedule({
        id: source.id,
        syncInterval: input.syncInterval,
        syncTime: input.syncTime,
        syncWeekday: input.syncWeekday,
      });
    } catch (failure) {
      setError(errorMessage(toAppError(failure)));
      return;
    }
    showToast({
      message: t('sources.schedule.success', { name: source.title }),
      tone: ToastTone.Ok,
    });
    onClose();
  };

  return (
    <SourceScheduleModal
      title={t('sources.schedule.dialogTitle', { name: source.title })}
      description={t('sources.schedule.dialogDescription')}
      submitLabel={t('sources.schedule.save')}
      schedule={schedule}
      submitting={updating}
      error={error}
      onChange={setSchedule}
      onSubmit={() => void submit()}
      onClose={onClose}
    />
  );
}
