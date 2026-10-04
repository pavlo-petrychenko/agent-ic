import { INITIALS_LENGTH, NAME_PART_SEPARATOR } from '@/shared/i18n/constants/initials.constants';

export const toInitials = (name: string): string =>
  name
    .trim()
    .split(NAME_PART_SEPARATOR)
    .filter((part) => part.length > 0)
    .slice(0, INITIALS_LENGTH)
    .map((part) => part.charAt(0).toLocaleUpperCase())
    .join('');
