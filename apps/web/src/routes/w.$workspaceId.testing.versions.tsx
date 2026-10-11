import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { TESTING_SEARCH_DEFAULTS, VersionsPage, testingSearchSchema } from '@/features/testing';

export const Route = createFileRoute('/w/$workspaceId/testing/versions')({
  validateSearch: testingSearchSchema,
  search: { middlewares: [stripSearchParams(TESTING_SEARCH_DEFAULTS)] },
  component: VersionsRoute,
});

function VersionsRoute() {
  return <VersionsPage />;
}
