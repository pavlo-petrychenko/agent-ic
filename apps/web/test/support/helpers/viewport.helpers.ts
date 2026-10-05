import { MEDIA_QUERY_CHANGE_EVENT } from '@/shared/viewport/constants/viewport.constants';
import type { FakeViewport } from '@test/support/typedefs/viewport.typedefs';

const WIDTH_QUERY = /\((min|max)-width:\s*(\d+)px\)/;
const MIN_WIDTH_BOUND = 'min';

export const createFakeViewport = (initialWidth: number): FakeViewport => {
  let width = initialWidth;
  const targets: EventTarget[] = [];

  const evaluate = (query: string): boolean => {
    const match = WIDTH_QUERY.exec(query);
    if (match === null) {
      return false;
    }
    const limit = Number(match[2]);
    return match[1] === MIN_WIDTH_BOUND ? width >= limit : width <= limit;
  };

  return {
    matchMedia: (query) => {
      const target = new EventTarget();
      targets.push(target);
      return Object.defineProperties(target, {
        media: { value: query },
        onchange: { value: null, writable: true },
        matches: { get: () => evaluate(query) },
        addListener: { value: () => undefined },
        removeListener: { value: () => undefined },
      }) as MediaQueryList;
    },
    setWidth: (next) => {
      width = next;
      for (const target of targets) {
        target.dispatchEvent(new Event(MEDIA_QUERY_CHANGE_EVENT));
      }
    },
  };
};
