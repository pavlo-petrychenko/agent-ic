import { createFileRoute } from '@tanstack/react-router';
import { TestingPage } from '@/features/testing';

export const Route = createFileRoute('/w/$workspaceId/testing/')({
  component: TestingIndexRoute,
});

function TestingIndexRoute() {
  return <TestingPage />;
}
