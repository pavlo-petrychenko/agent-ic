import { createFileRoute } from '@tanstack/react-router';
import { KnowledgePage } from '@/features/knowledge';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/knowledge')({
  component: KnowledgeRoute,
});

function KnowledgeRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Knowledge}>
      <KnowledgePage />
    </SectionGate>
  );
}
