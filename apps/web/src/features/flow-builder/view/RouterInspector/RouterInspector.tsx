import { PortName } from '@agent-ic/flow';
import { useTranslation } from 'react-i18next';
import { FLOW_BUILDER_NAMESPACE } from '@/features/flow-builder/constants/flowBuilderI18n.constants';
import { LIST_VALUE_JOINER } from '@/features/flow-builder/constants/inspector.constants';
import { FieldList } from '@/features/flow-builder/view/FieldList';
import { RouteCard } from '@/features/flow-builder/view/RouterInspector/RouteCard';
import type { RouterInspectorProps } from '@/features/flow-builder/view/RouterInspector/RouterInspector.typedefs';
import { Button, ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout } from '@/shared/ui/display/Callout';
import { RowList } from '@/shared/ui/display/RowList';
import { IconName } from '@/shared/ui/foundations/Icon';
import { InspectorSection } from '@/shared/ui/layout/Inspector';

export function RouterInspector({
  routes,
  fields,
  otherwise,
  backgroundSteps,
  ruleError,
  conditionError,
  canAddRoute,
  onAddRoute,
  onRenameRoute,
  onMoveRoute,
  onRemoveRoute,
  onConditionChange,
}: RouterInspectorProps) {
  const { t } = useTranslation(FLOW_BUILDER_NAMESPACE);

  return (
    <>
      <InspectorSection title={t('inspector.router.routes')}>
        {routes.map((route, index) => (
          <RouteCard
            key={route.rule.id}
            index={index}
            total={routes.length}
            route={route}
            fieldOptions={fields.map((field) => field.path)}
            ruleError={(segment) => ruleError(index, segment)}
            conditionError={(position, segment) => conditionError(index, position, segment)}
            onRename={(label) => onRenameRoute(route.rule.id, label)}
            onMove={(offset) => onMoveRoute(route.rule.id, offset)}
            onRemove={() => onRemoveRoute(route.rule.id)}
            onConditionChange={(position, patch) =>
              onConditionChange(route.rule.id, position, patch)
            }
          />
        ))}
        <Button
          className="self-start"
          variant={ButtonVariant.Ghost}
          size={ButtonSize.Sm}
          icon={IconName.Plus}
          disabled={!canAddRoute}
          onClick={onAddRoute}
        >
          {t('inspector.router.addRoute')}
        </Button>
      </InspectorSection>
      <InspectorSection title={t('inspector.router.otherwise')}>
        <RowList
          aria-label={t('inspector.router.otherwise')}
          rows={[
            {
              id: PortName.Else,
              name: t('port.else'),
              meta:
                otherwise.length === 0
                  ? t('inspector.router.notConnected')
                  : t('inspector.router.target', {
                      name: otherwise.map((target) => target.label).join(LIST_VALUE_JOINER),
                    }),
            },
          ]}
        />
      </InspectorSection>
      <FieldList title={t('inspector.router.fields')} rows={fields} />
      {backgroundSteps.length > 0 && (
        <Callout>
          {t('inspector.router.backgroundNote', {
            count: backgroundSteps.length,
            names: backgroundSteps.join(LIST_VALUE_JOINER),
          })}
        </Callout>
      )}
    </>
  );
}
