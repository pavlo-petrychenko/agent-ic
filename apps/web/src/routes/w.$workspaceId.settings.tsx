import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SettingsShell } from '@/features/settings';

export const Route = createFileRoute('/w/$workspaceId/settings')({
  component: SettingsRoute,
});

function SettingsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SettingsShell workspaceId={workspaceId}>
      <Outlet />
    </SettingsShell>
  );
}
