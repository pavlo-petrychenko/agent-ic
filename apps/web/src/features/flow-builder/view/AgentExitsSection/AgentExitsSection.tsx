import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { LIST_VALUE_JOINER } from '@/features/flow-builder/constants/inspector.constants';
import type { AgentExitsSectionProps } from '@/features/flow-builder/view/AgentExitsSection/AgentExitsSection.typedefs';
import { TemplateField } from '@/features/flow-builder/view/TemplateField';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { Switch } from '@/shared/ui/inputs/Switch';
import { InspectorSection } from '@/shared/ui/layout/Inspector';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';

export function AgentExitsSection({ stepName, view, variables }: AgentExitsSectionProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);
  const enabled = view.exits.filter((exit) => exit.when !== null);

  return (
    <InspectorSection
      title={t('inspector.agent.exits.title')}
      note={t(
        enabled.length === 0 ? 'inspector.agent.exits.noteOff' : 'inspector.agent.exits.noteOn',
      )}
    >
      {view.inBackground && enabled.length > 0 && (
        <Callout tone={CalloutTone.Err}>
          {t('inspector.agent.exits.inBackground', { name: stepName })}
        </Callout>
      )}
      {view.exits.map((exit) => (
        <div key={exit.kind} className="flex min-w-0 flex-col gap-2">
          <Switch
            label={t(`inspector.agent.exits.toggle.${exit.kind}`)}
            checked={exit.when !== null}
            onCheckedChange={(on) => view.onToggle(exit.kind, on)}
          />
          {exit.when !== null && (
            <>
              <Text kind={TextKind.Caption} color={TextColor.Mute} aria-hidden="true">
                {t('inspector.agent.exits.when')}
              </Text>
              <TemplateField
                label={t(`inspector.agent.exits.whenLabel.${exit.kind}`)}
                value={exit.when}
                variables={variables}
                hint={null}
                issue={exit.whenIssue}
                placeholder={t(`inspector.agent.exits.defaultWhen.${exit.kind}`)}
                onChange={(when) => view.onWhenChange(exit.kind, when)}
                onCommit={view.onCommit}
              />
              {exit.secondMessageFrom !== null && (
                <Text kind={TextKind.Small} color={TextColor.Warn}>
                  {t('inspector.agent.exits.secondMessage', { name: exit.secondMessageFrom })}
                </Text>
              )}
            </>
          )}
        </div>
      ))}
      {enabled.length === 0 ? (
        <Text kind={TextKind.Caption} color={TextColor.Mute}>
          {t('inspector.agent.exits.off')}
        </Text>
      ) : (
        <>
          <RowList
            aria-label={t('inspector.agent.exits.routes')}
            rows={enabled.map((exit) => ({
              id: exit.kind,
              name: t(`port.${exit.kind}`),
              meta:
                exit.targets.length === 0
                  ? t(`inspector.agent.exits.default.${exit.kind}`)
                  : exit.targets.map((target) => target.label).join(LIST_VALUE_JOINER),
            }))}
          />
          <Callout icon={IconName.Info}>{t('inspector.agent.exits.note')}</Callout>
        </>
      )}
    </InspectorSection>
  );
}
