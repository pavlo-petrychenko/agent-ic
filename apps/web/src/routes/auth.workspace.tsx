import { createFileRoute } from '@tanstack/react-router';
import { requireSession, SessionGate, WorkspaceStepPage } from '@/features/auth';

export const Route = createFileRoute('/auth/workspace')({
  beforeLoad: ({ location }) => requireSession(location),
  component: WorkspaceStepRoute,
});

function WorkspaceStepRoute() {
  return (
    <SessionGate>
      <WorkspaceStepPage />
    </SessionGate>
  );
}
