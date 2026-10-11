import { createFileRoute } from '@tanstack/react-router';
import { VersionsPage } from '@/features/testing';

export const Route = createFileRoute('/w/$workspaceId/testing/versions')({
  component: VersionsRoute,
});

function VersionsRoute() {
  return <VersionsPage />;
}
