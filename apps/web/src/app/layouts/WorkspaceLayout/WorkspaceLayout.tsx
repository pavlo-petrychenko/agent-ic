import { type ReactNode, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { setWorkspaceId } from '@/shared/api/requestContext';

import { AppHeader } from '../AppHeader/AppHeader';
import styles from './WorkspaceLayout.module.scss';

interface WorkspaceLayoutProps {
  workspaceId: string;
  children: ReactNode;
}

export function WorkspaceLayout({ workspaceId, children }: WorkspaceLayoutProps) {
  const { t } = useTranslation();

  useEffect(() => {
    setWorkspaceId(workspaceId);
    return () => setWorkspaceId(null);
  }, [workspaceId]);

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
