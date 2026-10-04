import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';
import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout';
import { requireSession, SessionGate } from '@/features/auth';
import { releaseWorkspaceId, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';

const workspaceParamsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const Route = createFileRoute('/w/$workspaceId')({
  params: { parse: (params) => workspaceParamsSchema.parse(params) },
  beforeLoad: ({ params, location }) => {
    requireSession(location);
    setWorkspaceId(params.workspaceId);
  },
  onLeave: (match) => releaseWorkspaceId(match.params.workspaceId),
  component: WorkspaceRoute,
});

function WorkspaceRoute() {
  const { workspaceId } = Route.useParams();
  return (
    <SessionGate>
      <WorkspaceLayout workspaceId={workspaceId}>
        <Outlet />
      </WorkspaceLayout>
    </SessionGate>
  );
}
