import { createFileRoute } from '@tanstack/react-router';
import { TestingPage, testingSearchSchema } from '@/features/testing';

export const Route = createFileRoute('/w/$workspaceId/testing/')({
  validateSearch: testingSearchSchema,
  component: TestingIndexRoute,
});

function TestingIndexRoute() {
  return <TestingPage />;
}
