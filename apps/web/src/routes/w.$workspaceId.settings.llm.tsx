import { createFileRoute } from '@tanstack/react-router';
import { LlmKeysPage } from '@/features/settings';
import { SectionGate, WorkspaceSection } from '@/features/workspace';

export const Route = createFileRoute('/w/$workspaceId/settings/llm')({
  component: LlmKeysRoute,
});

function LlmKeysRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SectionGate workspaceId={workspaceId} section={WorkspaceSection.LlmKeys}>
      <LlmKeysPage workspaceId={workspaceId} />
    </SectionGate>
  );
}
