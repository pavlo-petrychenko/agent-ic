import { createFileRoute } from '@tanstack/react-router';
import { FlowBuilderPage } from '@/features/flow-builder';

export const Route = createFileRoute('/w/$workspaceId/agents/$agentId')({
  component: FlowBuilderRoute,
});

function FlowBuilderRoute() {
  return <FlowBuilderPage />;
}
