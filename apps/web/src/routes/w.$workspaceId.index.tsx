import { createFileRoute } from '@tanstack/react-router';
import { WorkspaceHome } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/')({
  component: WorkspaceHomeRoute,
});

function WorkspaceHomeRoute() {
  const { workspaceId } = Route.useParams();
  return <WorkspaceHome workspaceId={workspaceId} />;
}
