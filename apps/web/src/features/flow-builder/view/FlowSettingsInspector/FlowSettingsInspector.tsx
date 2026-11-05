import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  FAILURE_CHOICES,
  FLOW_SETTINGS_FAILURE_NAME,
  FailureChoice,
} from '@/features/flow-builder/constants/flowSettings.constants';
import type { FlowSettingsInspectorProps } from '@/features/flow-builder/view/FlowSettingsInspector/FlowSettingsInspector.typedefs';
import { SilenceField } from '@/features/flow-builder/view/FlowSettingsInspector/SilenceField';
import { HandoffNotifyFields } from '@/features/flow-builder/view/HandoffNotifyFields';
import { HandoffWaitFields } from '@/features/flow-builder/view/HandoffWaitFields';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { Radio, RadioOrientation } from '@/shared/ui/inputs/Radio';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function FlowSettingsInspector({
  settings,
  handoff,
  variables,
  recipients,
  counts,
  fallbackIssue,
  onRecipientsChange,
  onChannelChange,
  onFallbackMessageChange,
  onFailureChange,
  onApologyChange,
  onAutoCloseToggle,
  onAutoCloseChange,
  onCommit,
}: FlowSettingsInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const failure = settings.onUnhandledFailure;
  const autoClose = settings.autoClose;

  return (
    <>
      <InspectorSection title={t('settings.handoff.title')} note={t('settings.handoff.note')}>
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('settings.handoff.hint')}
        </Text>
        <HandoffNotifyFields
          channels={handoff.notify.channels}
          recipients={recipients}
          counts={counts}
          onRecipientsChange={onRecipientsChange}
          onChannelChange={onChannelChange}
        />
        <HandoffWaitFields
          label={t('inspector.escalation.until')}
          handoff={handoff}
          variables={variables}
          fallbackIssue={fallbackIssue}
          onFallbackMessageChange={onFallbackMessageChange}
          onCommit={onCommit}
        />
      </InspectorSection>
      <InspectorSection title={t('settings.failure.title')} note={t('settings.failure.note')}>
        <Radio
          name={FLOW_SETTINGS_FAILURE_NAME}
          ariaLabel={t('settings.failure.title')}
          orientation={RadioOrientation.Vertical}
          value={failure === null ? FailureChoice.Fail : FailureChoice.Handoff}
          options={FAILURE_CHOICES.map((choice) => ({
            value: choice,
            label: t(`settings.failure.choice.${choice}`),
          }))}
          onValueChange={(value) =>
            onFailureChange(
              FAILURE_CHOICES.find((choice) => choice === value) ?? FailureChoice.Fail,
            )
          }
        />
        {failure === null ? (
          <Text kind={TextKind.Caption} color={TextColor.Mute}>
            {t('settings.failure.failHint')}
          </Text>
        ) : (
          <>
            <Text kind={TextKind.Caption} color={TextColor.Mute} aria-hidden="true">
              {t('settings.failure.apology')}
            </Text>
            <TemplateField
              label={t('settings.failure.apology')}
              value={failure.customerMessage}
              variables={variables}
              hint={t('settings.failure.handoffHint')}
              issue={null}
              placeholder={t('settings.failure.defaultApology')}
              onChange={onApologyChange}
              onCommit={onCommit}
            />
          </>
        )}
      </InspectorSection>
      <InspectorSection title={t('settings.autoClose.title')}>
        <Switch
          label={t('settings.autoClose.toggle')}
          checked={autoClose !== null}
          onCheckedChange={onAutoCloseToggle}
        />
        {autoClose !== null && (
          <SilenceField minutes={autoClose.afterMinutes} onChange={onAutoCloseChange} />
        )}
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t(autoClose === null ? 'settings.autoClose.offHint' : 'settings.autoClose.onHint')}
        </Text>
      </InspectorSection>
    </>
  );
}
