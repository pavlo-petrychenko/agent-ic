import { useMatches } from '@tanstack/react-router';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import type { WorkspaceLayoutProps } from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.typedefs';
import {
  useUpdateMyLocale,
  WorkspaceAccess,
  WorkspaceNavForm,
  WorkspaceNavigation,
} from '@/features/workspace';
import styles from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.module.scss';

export function WorkspaceLayout({ workspaceId, children }: WorkspaceLayoutProps) {
  const saveLocale = useUpdateMyLocale();
  const navForm = useMatches({
    select: (matches) =>
      matches.findLast((match) => match.staticData.navForm !== undefined)?.staticData.navForm ??
      WorkspaceNavForm.Sidebar,
  });

  return (
    <div className="flex h-screen">
      <aside className="shrink-0">
        <WorkspaceNavigation
          workspaceId={workspaceId}
          form={navForm}
          footerAction={<LocaleSwitcher compact onLocaleChange={saveLocale} />}
        />
      </aside>
      <main className={`${styles.main} min-w-0 flex-1 overflow-auto`}>
        <WorkspaceAccess workspaceId={workspaceId}>{children}</WorkspaceAccess>
      </main>
    </div>
  );
}
