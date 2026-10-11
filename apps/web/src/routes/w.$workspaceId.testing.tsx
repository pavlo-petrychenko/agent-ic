import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/testing')({
  component: TestingRoute,
});

function TestingRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Testing}>
      <Outlet />
    </SectionGate>
  );
}
