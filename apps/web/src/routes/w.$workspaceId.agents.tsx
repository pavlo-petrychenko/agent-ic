import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/agents')({
  component: AgentsRoute,
});

function AgentsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Agents}>
      <Outlet />
    </SectionGate>
  );
}
