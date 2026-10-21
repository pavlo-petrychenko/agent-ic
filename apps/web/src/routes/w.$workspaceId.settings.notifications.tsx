import { createFileRoute } from '@tanstack/react-router';
import { NotificationsPage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/notifications')({
  component: NotificationsRoute,
});

function NotificationsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Notifications}>
      <NotificationsPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
