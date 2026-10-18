import { createFileRoute } from '@tanstack/react-router';
import { PromptPage } from '@/features/prompts';

export const Route = createFileRoute('/w/$workspaceId/prompts/$promptId')({
  component: PromptRoute,
});

function PromptRoute() {
  const { promptId } = Route.useParams();
  return <PromptPage promptId={promptId} />;
}
