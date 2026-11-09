import { useEffect, useState } from 'react';
import {
  OBSERVED_ATTRIBUTES,
  type TourAnchor,
} from '@/features/onboarding/constants/tourAnchor.constants';
import {
  findTourAnchor,
  isDialogOpen,
} from '@/features/onboarding/logic/helpers/tourAnchor.helpers';
import type { TourTarget } from '@/features/onboarding/typedefs/tour.typedefs';

const NO_TARGET: TourTarget = { target: null, blocked: false };

export function useTourTarget(anchor: TourAnchor | null, active: boolean): TourTarget {
  const [found, setFound] = useState<TourTarget>(NO_TARGET);

  useEffect(() => {
    if (!active) {
      return;
    }
    let frame: number | null = null;
    const resolve = () => {
      const target = anchor === null ? null : findTourAnchor(anchor);
      const blocked = isDialogOpen();
      setFound((previous) =>
        previous.target === target && previous.blocked === blocked ? previous : { target, blocked },
      );
    };
    const schedule = () => {
      if (frame !== null) {
        return;
      }
      frame = window.requestAnimationFrame(() => {
        frame = null;
        resolve();
      });
    };

    resolve();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: OBSERVED_ATTRIBUTES,
    });

    return () => {
      observer.disconnect();
      if (frame !== null) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [anchor, active]);

  return active ? found : NO_TARGET;
}
