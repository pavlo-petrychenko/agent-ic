import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { IssuePathSegment } from '@/features/flow-builder/constants/inspector.constants';
import type { HandoffWaitFieldsProps } from '@/features/flow-builder/view/HandoffWaitFields/HandoffWaitFields.typedefs';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { RowList } from '@/shared/ui/display/RowList';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function HandoffWaitFields({
  label,
  handoff,
  variables,
  fallbackIssue,
  onFallbackMessageChange,
  onCommit,
}: HandoffWaitFieldsProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const minutes = (value: number | null) =>
    value === null
      ? t('inspector.escalation.never')
      : t('inspector.escalation.minutes', { count: value });

  return (
    <>
      <RowList
        aria-label={label}
        mono={false}
        rows={[
          {
            id: IssuePathSegment.Reminder,
            name: t('inspector.escalation.remindAfter'),
            meta: minutes(handoff.reminderAfterMinutes),
          },
          {
            id: IssuePathSegment.Fallback,
            name: t('inspector.escalation.fallbackAfter'),
            meta: minutes(handoff.fallbackAfterMinutes),
          },
        ]}
      />
      <Text kind={TextKind.Caption} color={TextColor.Mute} aria-hidden="true">
        {t('inspector.escalation.fallbackMessage')}
      </Text>
      <TemplateField
        label={t('inspector.escalation.fallbackMessage')}
        value={handoff.fallbackMessage}
        variables={variables}
        hint={null}
        issue={fallbackIssue}
        placeholder={t('inspector.escalation.fallbackPlaceholder')}
        onChange={onFallbackMessageChange}
        onCommit={onCommit}
      />
    </>
  );
}
