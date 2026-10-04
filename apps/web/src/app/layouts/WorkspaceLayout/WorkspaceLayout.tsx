import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { AppHeader } from '@/app/layouts/AppHeader/AppHeader';

import styles from './WorkspaceLayout.module.scss';

interface WorkspaceLayoutProps {
  workspaceId: string;
  children: ReactNode;
}

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
