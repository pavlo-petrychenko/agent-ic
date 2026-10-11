import { createFileRoute, stripSearchParams } from '@tanstack/react-router';
import { TESTING_SEARCH_DEFAULTS, TestingPage, testingSearchSchema } from '@/features/testing';

export const Route = createFileRoute('/w/$workspaceId/testing/')({
  validateSearch: testingSearchSchema,
  search: { middlewares: [stripSearchParams(TESTING_SEARCH_DEFAULTS)] },
  component: TestingIndexRoute,
});

function TestingIndexRoute() {
  return <TestingPage />;
}
