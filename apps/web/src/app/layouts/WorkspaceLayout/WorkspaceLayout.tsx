import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import type { WorkspaceLayoutProps } from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.typedefs';
import { WorkspaceAccess, WorkspaceNavigation } from '@/features/workspace';
import styles from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.module.scss';

export function WorkspaceLayout({ workspaceId, children }: WorkspaceLayoutProps) {
  return (
    <div className="flex h-screen">
      <aside className="shrink-0">
        <WorkspaceNavigation workspaceId={workspaceId} footerAction={<LocaleSwitcher compact />} />
      </aside>
      <main className={`${styles.main} min-w-0 flex-1 overflow-auto pb-8`}>
        <WorkspaceAccess workspaceId={workspaceId}>{children}</WorkspaceAccess>
      </main>
    </div>
  );
}
