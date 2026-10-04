import {
  OPERATIONAL_ROUTE_SEGMENTS,
  URL_PATH_SEPARATOR,
  URL_QUERY_SEPARATOR,
} from './observability.constants';

export const isOperationalUrl = (url: string | undefined): boolean => {
  if (url === undefined) {
    return false;
  }
  const [path = ''] = url.split(URL_QUERY_SEPARATOR);
  return path
    .split(URL_PATH_SEPARATOR)
    .some((segment) => OPERATIONAL_ROUTE_SEGMENTS.includes(segment));
};
