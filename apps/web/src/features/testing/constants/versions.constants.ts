import { BadgeTone } from '@/shared/ui/display/Badge';

export enum VersionKind {
  Draft = 'draft',
  Live = 'live',
  Archived = 'archived',
}

export const VERSION_BADGE_TONE: Readonly<Record<VersionKind, BadgeTone>> = {
  [VersionKind.Draft]: BadgeTone.Warn,
  [VersionKind.Live]: BadgeTone.Ok,
  [VersionKind.Archived]: BadgeTone.Neutral,
};

export const VERSION_DATE_FORMAT: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };

export const NOTE_LINE_BREAK = /\r?\n/;

export const VERSION_META_SEPARATOR = ' · ';
