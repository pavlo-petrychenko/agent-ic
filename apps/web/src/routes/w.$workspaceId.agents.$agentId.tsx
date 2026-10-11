import { createFileRoute } from '@tanstack/react-router';
import { FlowBuilderPage } from '@/features/flow-builder';
import { WorkspaceNavForm } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/agents/$agentId')({
  staticData: { navForm: WorkspaceNavForm.Rail },
  component: FlowBuilderRoute,
});

function FlowBuilderRoute() {
  const { workspaceId, agentId } = Route.useParams();
  return <FlowBuilderPage workspaceId={workspaceId} agentId={agentId} />;
}
