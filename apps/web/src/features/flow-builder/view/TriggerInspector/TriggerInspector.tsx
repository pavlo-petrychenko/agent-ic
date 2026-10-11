import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import {
  MESSAGE_TYPES,
  MessageTreatment,
  MessageType,
} from '@/features/flow-builder/constants/inspector.constants';
import { FieldList } from '@/features/flow-builder/view/FieldList';
import type { TriggerInspectorProps } from '@/features/flow-builder/view/TriggerInspector/TriggerInspector.typedefs';
import { Badge, BadgeTone } from '@/shared/ui/display/Badge';
import { Callout } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { InspectorSection } from '@/shared/ui/layout/Inspector';

export function TriggerInspector({ fields }: TriggerInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <>
      <InspectorSection title={t('inspector.trigger.channels')}>
        <Callout>{t('inspector.trigger.noChannels')}</Callout>
      </InspectorSection>
      <InspectorSection title={t('inspector.trigger.handover')}>
        <Callout>{t('inspector.trigger.handoverNote')}</Callout>
      </InspectorSection>
      <InspectorSection title={t('inspector.trigger.messageTypes')}>
        <RowList
          aria-label={t('inspector.trigger.messageTypes')}
          mono={false}
          rows={Object.values(MessageType).map((type) => ({
            id: type,
            name: t(`inspector.trigger.messageType.${type}`),
            meta:
              MESSAGE_TYPES[type] === MessageTreatment.Runs ? (
                <Badge tone={BadgeTone.Ok}>
                  {t(`inspector.trigger.treatment.${MESSAGE_TYPES[type]}`)}
                </Badge>
              ) : (
                t(`inspector.trigger.treatment.${MESSAGE_TYPES[type]}`)
              ),
          }))}
        />
      </InspectorSection>
      <FieldList title={t('inspector.trigger.available')} rows={fields} />
    </>
  );
}
