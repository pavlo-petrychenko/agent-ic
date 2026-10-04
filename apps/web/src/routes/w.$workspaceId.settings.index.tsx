import { createFileRoute } from '@tanstack/react-router';
import { SettingsHome } from '@/features/settings';

export const Route = createFileRoute('/w/$workspaceId/settings/')({
  component: SettingsHomeRoute,
});

function SettingsHomeRoute() {
  const { workspaceId } = Route.useParams();
  return <SettingsHome workspaceId={workspaceId} />;
}
