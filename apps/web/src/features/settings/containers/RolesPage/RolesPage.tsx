import { PERMISSION_MATRIX } from '@agent-ic/contracts';
import type { PermissionAction, ResourcePermissions, WorkspaceRole } from '@agent-ic/contracts';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DEFAULT_ROLE,
  ROLE_ACTION_LABEL_KEYS,
  ROLE_FIXTURES,
  ROLE_MATRIX_ACTIONS,
  ROLE_RESOURCE_DEFINITIONS,
} from '@/features/settings/constants/roles.constants';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import type { RolesPageProps } from '@/features/settings/containers/RolesPage/RolesPage.typedefs';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
import type { RoleMatrixRow } from '@/features/settings/typedefs/role.typedefs';
import { RoleList } from '@/features/settings/view/RoleList';
import { RoleMatrix } from '@/features/settings/view/RoleMatrix';
import { Button, ButtonVariant } from '@/shared/ui/actions/Button';
import { Callout, CalloutTone } from '@/shared/ui/display/Callout';
import { Card } from '@/shared/ui/display/Card';
import { IconName } from '@/shared/ui/foundations/Icon';
import { PageHeader } from '@/shared/ui/layout/PageHeader';
import { Breadcrumb } from '@/shared/ui/navigation/Breadcrumb';
import { Heading, HeadingElement, HeadingSize } from '@/shared/ui/typography/Heading';
import { Text, TextColor, TextKind } from '@/shared/ui/typography/Text';
import styles from '@/features/settings/containers/RolesPage/RolesPage.module.scss';

export function RolesPage({ workspaceId }: RolesPageProps) {
  const { t } = useTranslation(SETTINGS_NAMESPACE);
  const { t: tCommon } = useTranslation();
  const [selectedId, setSelectedId] = useState<WorkspaceRole>(DEFAULT_ROLE);
  const [draft, setDraft] = useState<ResourcePermissions>(() => ({
    ...PERMISSION_MATRIX[DEFAULT_ROLE],
  }));

  const roles = ROLE_FIXTURES.map((role) => ({
    id: role.id,
    title: tCommon(`roles.name.${role.id}`),
    description: `${t(role.descriptionKey)} · ${t('roles.members', {
      count: role.memberNames.length,
    })}`,
  }));

  const memberNames = ROLE_FIXTURES.find((role) => role.id === selectedId)?.memberNames ?? [];

  const columns = ROLE_MATRIX_ACTIONS.map((action) => ({
    id: action,
    label: t(ROLE_ACTION_LABEL_KEYS[action]),
    action,
  }));

  const rows: readonly RoleMatrixRow[] = ROLE_RESOURCE_DEFINITIONS.map((definition) => ({
    id: definition.id,
    label: t(definition.labelKey),
    note: definition.noteKey === null ? null : t(definition.noteKey),
    actions: definition.actions,
    granted: draft[definition.resource],
  }));

  const selectRole = (id: WorkspaceRole) => {
    setSelectedId(id);
    setDraft({ ...PERMISSION_MATRIX[id] });
  };

  const toggle = (rowId: string, action: PermissionAction, checked: boolean) => {
    const definition = ROLE_RESOURCE_DEFINITIONS.find((entry) => entry.id === rowId);
    if (definition === undefined) {
      return;
    }
    setDraft((current) => {
      const actions = current[definition.resource];
      const next = checked
        ? [...new Set([...actions, action])]
        : actions.filter((entry) => entry !== action);
      return { ...current, [definition.resource]: next };
    });
  };

  return (
    <div className="flex flex-col gap-5 pb-8">
      <PageHeader
        title={t('nav.roles')}
        subtitle={t('roles.subtitle')}
        crumbs={
          <Breadcrumb
            ariaLabel={t('breadcrumb')}
            moreLabel={t('breadcrumbMore')}
            items={[{ label: t('title'), to: settingsHref(workspaceId) }]}
          />
        }
      />
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,3fr)] gap-4 px-7">
        <RoleList
          roles={roles}
          selectedId={selectedId}
          ariaLabel={t('nav.roles')}
          newRoleLabel={t('roles.newRole')}
          onSelect={selectRole}
          onNewRole={() => undefined}
        />
        <div className="flex flex-col gap-4">
          <Card flush>
            <div className={styles.header}>
              <div className={styles.heading}>
                <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
                  {tCommon(`roles.name.${selectedId}`)}
                </Heading>
                <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
                  {t('roles.members', { count: memberNames.length })}
                  {memberNames.length > 0 ? ` · ${memberNames.join(', ')}` : ''}
                </Text>
              </div>
              <div className={styles.actions}>
                <Button variant={ButtonVariant.Secondary} onClick={() => undefined}>
                  {t('roles.duplicate')}
                </Button>
                <Button onClick={() => undefined}>{t('roles.save')}</Button>
              </div>
            </div>
            <RoleMatrix
              resourceLabel={t('roles.matrix.resource')}
              columns={columns}
              rows={rows}
              onToggle={toggle}
            />
          </Card>
          <Callout tone={CalloutTone.Info} icon={IconName.Info}>
            {t('roles.hint')}
          </Callout>
        </div>
      </div>
    </div>
  );
}
