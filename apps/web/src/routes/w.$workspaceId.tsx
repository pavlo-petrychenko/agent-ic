import { createFileRoute, Outlet } from '@tanstack/react-router';
import { z } from 'zod';

import { WorkspaceLayout } from '@/app/layouts/WorkspaceLayout/WorkspaceLayout';

const workspaceParamsSchema = z.object({
  workspaceId: z.string().min(1),
});

export const Route = createFileRoute('/w/$workspaceId')({
  params: { parse: (params) => workspaceParamsSchema.parse(params) },
  component: WorkspaceRoute,
});

function WorkspaceRoute() {
  const { workspaceId } = Route.useParams();

  return (
    <WorkspaceLayout workspaceId={workspaceId}>
      <Outlet />
    </WorkspaceLayout>
  );
}
