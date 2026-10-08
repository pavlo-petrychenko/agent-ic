import { createFileRoute } from '@tanstack/react-router';
import { GeneralPage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/general')({
  component: GeneralRoute,
});

function GeneralRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.General}>
      <GeneralPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
