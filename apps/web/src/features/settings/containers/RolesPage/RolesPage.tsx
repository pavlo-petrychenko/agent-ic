import { useTranslation } from 'react-i18next';
import { SETTINGS_NAMESPACE } from '@/features/settings/constants/settingsI18n.constants';
import { CreateRoleDialog } from '@/features/settings/containers/CreateRoleDialog';
import type { RolesPageProps } from '@/features/settings/containers/RolesPage/RolesPage.typedefs';
import { useRolesPage } from '@/features/settings/containers/RolesPage/useRolesPage';
import { settingsHref } from '@/features/settings/logic/helpers/route.helpers';
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
  const page = useRolesPage();

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
          roles={page.roles}
          selectedId={page.selectedId}
          ariaLabel={t('nav.roles')}
          newRoleLabel={t('roles.newRole')}
          onSelect={page.onSelect}
          onNewRole={page.onNewRole}
        />
        <div className="flex flex-col gap-4">
          {page.selectedTitle === null ? null : (
            <Card flush>
              <div className={styles.header}>
                <div className={styles.heading}>
                  <Heading size={HeadingSize.H3} as={HeadingElement.H3}>
                    {page.selectedTitle}
                  </Heading>
                  <Text kind={TextKind.BodySmall} color={TextColor.Mute}>
                    {t('roles.members', { count: page.memberCount })}
                    {page.memberNames.length > 0 ? ` · ${page.memberNames.join(', ')}` : ''}
                  </Text>
                </div>
                <div className={styles.actions}>
                  <Button
                    variant={ButtonVariant.Secondary}
                    disabled={page.locked}
                    onClick={page.onDuplicate}
                  >
                    {t('roles.duplicate')}
                  </Button>
                  <Button loading={page.saving} disabled={page.locked} onClick={page.onSave}>
                    {t('roles.save')}
                  </Button>
                </div>
              </div>
              <RoleMatrix {...page.matrix} readOnly={page.locked} onToggle={page.onToggle} />
            </Card>
          )}
          <Callout tone={CalloutTone.Info} icon={IconName.Info}>
            {page.hint}
          </Callout>
        </div>
      </div>
      <CreateRoleDialog {...page.createRoleDialog} />
    </div>
  );
}
