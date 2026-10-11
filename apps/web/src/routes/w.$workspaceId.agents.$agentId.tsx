import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import {
  BUILDER_SEARCH_DEFAULTS,
  FlowBuilderPage,
  builderSearchSchema,
} from '@/features/flow-builder';
import { WorkspaceNavForm } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/agents/$agentId')({
  staticData: { navForm: WorkspaceNavForm.Rail },
  validateSearch: builderSearchSchema,
  search: { middlewares: [stripSearchParams(BUILDER_SEARCH_DEFAULTS)] },
  component: FlowBuilderRoute,
});

function FlowBuilderRoute() {
  const { workspaceId, agentId } = Route.useParams();
  const { node } = Route.useSearch();
  return <FlowBuilderPage workspaceId={workspaceId} agentId={agentId} nodeId={node} />;
}
