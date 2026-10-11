import { createFileRoute } from '@tanstack/react-router';
import { AgentsPage } from '@/features/agents';

export const Route = createFileRoute('/w/$workspaceId/agents/')({
  component: AgentsIndexRoute,
});

function AgentsIndexRoute() {
  const { workspaceId } = Route.useParams();
  return <AgentsPage workspaceId={workspaceId} />;
}
