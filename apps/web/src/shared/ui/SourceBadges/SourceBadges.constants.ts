import { BadgeTone } from '@/shared/ui/Badge';

export enum SourceKind {
  Channel = 'channel',
  Flow = 'flow',
  Operator = 'operator',
  Api = 'api',
  System = 'system',
}

export const SOURCE_BADGE_TONE: Readonly<Record<SourceKind, BadgeTone>> = {
  [SourceKind.Channel]: BadgeTone.Neutral,
  [SourceKind.Flow]: BadgeTone.Violet,
  [SourceKind.Operator]: BadgeTone.Accent,
  [SourceKind.Api]: BadgeTone.Warn,
  [SourceKind.System]: BadgeTone.Neutral,
};
