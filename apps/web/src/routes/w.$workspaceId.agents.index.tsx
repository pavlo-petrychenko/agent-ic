import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { AGENTS_SEARCH_DEFAULTS, AgentsPage, agentsSearchSchema } from '@/features/agents';

export const Route = createFileRoute('/w/$workspaceId/agents/')({
  validateSearch: agentsSearchSchema,
  search: { middlewares: [stripSearchParams(AGENTS_SEARCH_DEFAULTS)] },
  component: AgentsIndexRoute,
});

function AgentsIndexRoute() {
  const { workspaceId } = Route.useParams();
  return <AgentsPage workspaceId={workspaceId} />;
}
