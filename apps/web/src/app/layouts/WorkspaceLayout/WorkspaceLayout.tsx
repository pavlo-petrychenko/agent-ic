import { useMatches } from '@tanstack/react-router';
import { LocaleSwitcher } from '@/app/components/LocaleSwitcher';
import type { WorkspaceLayoutProps } from '@/app/layouts/WorkspaceLayout/WorkspaceLayout.typedefs';
import { UsageLimitBanner } from '@/features/settings';
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
      <main className={`${styles.main} flex min-w-0 flex-1 flex-col overflow-auto`}>
        <div className="shrink-0">
          <UsageLimitBanner workspaceId={workspaceId} />
        </div>
        <div className="min-h-0 flex-1">
          <WorkspaceAccess workspaceId={workspaceId}>{children}</WorkspaceAccess>
        </div>
      </main>
    </div>
  );
}
