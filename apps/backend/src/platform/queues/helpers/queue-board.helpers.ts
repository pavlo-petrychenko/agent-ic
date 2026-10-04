import { URL_PATH_SEPARATOR } from '@/platform/queues/constants/queue-board.constants';

export const relativeToBase = (url: string, basePath: string): string => {
  const relative = url.startsWith(basePath) ? url.slice(basePath.length) : url;
  return relative.startsWith(URL_PATH_SEPARATOR) ? relative : `${URL_PATH_SEPARATOR}${relative}`;
};
