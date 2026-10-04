import { createFileRoute } from '@tanstack/react-router';
import { SectionGate, SectionPlaceholderPage, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/agents')({
  component: AgentsRoute,
});

function AgentsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Agents}>
      <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Agents} />
    </SectionGate>
  );
}
