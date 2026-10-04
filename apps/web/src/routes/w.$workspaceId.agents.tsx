import { createFileRoute } from '@tanstack/react-router';
import { SectionPlaceholderPage, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/agents')({
  component: AgentsRoute,
});

function AgentsRoute() {
  const { workspaceId } = Route.useParams();
  return <SectionPlaceholderPage workspaceId={workspaceId} section={WorkspaceSection.Agents} />;
}
