import { type ReactNode, useEffect, useState } from 'react';
import { createFakeViewport } from '@test/support/helpers/viewport.helpers';

interface ViewportStubProps {
  width: number;
  children: ReactNode;
}

export function ViewportStub({ width, children }: ViewportStubProps) {
  const [{ original, stub }] = useState(() => {
    const previous = window.matchMedia;
    const fake = createFakeViewport(width).matchMedia;
    window.matchMedia = fake;
    return { original: previous, stub: fake };
  });

  useEffect(() => {
    window.matchMedia = stub;
    return () => {
      window.matchMedia = original;
    };
  }, [original, stub]);

  return <>{children}</>;
}
