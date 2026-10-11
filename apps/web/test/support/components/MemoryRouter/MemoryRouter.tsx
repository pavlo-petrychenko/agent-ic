import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from '@tanstack/react-router';
import type { RouterHistory } from '@tanstack/react-router';
import { type ReactNode, useState } from 'react';
import { ROOT_PATH } from '@test/support/constants/router.constants';

interface MemoryRouterProps {
  children: ReactNode;
  initialPath?: string;
  history?: RouterHistory | null;
}

export function MemoryRouter({
  children,
  initialPath = ROOT_PATH,
  history = null,
}: MemoryRouterProps) {
  const [router] = useState(() =>
    createRouter({
      routeTree: createRootRoute({ component: () => <>{children}</> }),
      history: history ?? createMemoryHistory({ initialEntries: [initialPath] }),
    }),
  );

  return <RouterProvider router={router} />;
}
