import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { ROOT_PATH } from '@/shared/testing/testing.constants';

interface MemoryRouterProps {
  children: ReactNode;
  initialPath?: string;
}

export function MemoryRouter({ children, initialPath = ROOT_PATH }: MemoryRouterProps) {
  const [router] = useState(() =>
    createRouter({
      routeTree: createRootRoute({ component: () => <>{children}</> }),
      history: createMemoryHistory({ initialEntries: [initialPath] }),
    }),
  );

  return <RouterProvider router={router} />;
}
