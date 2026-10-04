import type { ComponentProps } from 'react';
import type { TextLinkTone } from '@/shared/ui/TextLink/TextLink.constants';

export interface TextLinkAnchorProps extends ComponentProps<'a'> {
  tone?: TextLinkTone;
  inline?: boolean;
}
