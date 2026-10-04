import { useTranslation } from 'react-i18next';
import { AppHeader } from '@/app/layouts/AppHeader';
import type { WorkspaceLayoutProps } from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.typedefs';
import styles from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.module.scss';

export function WorkspaceLayout({ workspaceId, children }: WorkspaceLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader>
        <span className={styles.workspace}>
          {t('workspace.label')} <code>{workspaceId}</code>
        </span>
      </AppHeader>
      <main className="mx-auto w-full max-w-page flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
