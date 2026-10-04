import { createFileRoute } from '@tanstack/react-router';
import { TeamPage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/team')({
  component: TeamRoute,
});

function TeamRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Team}>
      <TeamPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
