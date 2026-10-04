import { createRouter } from '@tanstack/react-router';
import { NotFound } from '@/app/components/NotFound';
import { RouteErrorFallback } from '@/app/components/RouteErrorFallback';
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
