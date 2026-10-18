import { createFileRoute } from '@tanstack/react-router';
import { UsagePage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/usage')({
  component: UsageRoute,
});

function UsageRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Usage}>
      <UsagePage workspaceId={workspaceId} />
    </SectionGate>
  );
}
