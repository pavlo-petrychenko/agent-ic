export const inboxSearchPattern = (search: string): string =>
  `%${search.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
