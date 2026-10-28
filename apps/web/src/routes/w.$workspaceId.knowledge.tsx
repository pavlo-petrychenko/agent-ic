import { createFileRoute } from '@tanstack/react-router';
import {
  KnowledgePage,
  knowledgeSearchSchema,
  KnowledgeGoogleSearchParam,
} from '@/features/knowledge';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/knowledge')({
  validateSearch: knowledgeSearchSchema,
  component: KnowledgeRoute,
});

function KnowledgeRoute() {
  const { workspaceId } = Route.useParams();
  const { kb, google } = Route.useSearch();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.Knowledge}>
      <KnowledgePage
        workspaceId={workspaceId}
        selectedKnowledgeBaseId={kb ?? null}
        googleConnected={google === KnowledgeGoogleSearchParam.Connected}
      />
    </SectionGate>
  );
}
