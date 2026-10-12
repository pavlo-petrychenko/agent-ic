import { createFileRoute } from '@tanstack/react-router';
import { RolesPage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/roles')({
  component: RolesRoute,
});

function RolesRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Roles}>
      <RolesPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
