import { createFileRoute } from '@tanstack/react-router';
import { PromptsPage } from '@/features/prompts';

export const Route = createFileRoute('/w/$workspaceId/prompts/')({
  component: PromptsIndexRoute,
});

function PromptsIndexRoute() {
  const { workspaceId } = Route.useParams();
  return <PromptsPage workspaceId={workspaceId} />;
}
