import { createRouter } from '@tanstack/react-router';

import { RouteErrorFallback } from '@/app/ErrorBoundary/RouteErrorFallback';
import { NotFound } from '@/app/NotFound/NotFound';
import { routeTree } from '@/routeTree.gen';

export const router = createRouter({
  routeTree,
  defaultErrorComponent: RouteErrorFallback,
  defaultNotFoundComponent: NotFound,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
