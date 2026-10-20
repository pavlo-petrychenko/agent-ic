import { createFileRoute, Outlet } from '@tanstack/react-router';
import { PromptsShell } from '@/features/prompts';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/prompts')({
  component: PromptsRoute,
});

function PromptsRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Prompts}>
      <PromptsShell workspaceId={workspaceId}>
        <Outlet />
      </PromptsShell>
    </SectionGate>
  );
}
