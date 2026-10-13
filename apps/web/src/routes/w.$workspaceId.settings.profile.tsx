import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/profile')({
  component: ProfileRoute,
});

function ProfileRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Profile}>
      <ProfilePage workspaceId={workspaceId} />
    </SectionGate>
  );
}
