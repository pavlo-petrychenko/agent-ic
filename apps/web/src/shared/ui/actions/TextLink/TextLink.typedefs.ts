import type { ComponentProps } from 'react';
import type { TextLinkTone } from '@/shared/ui/actions/TextLink/TextLink.constants';

export interface TextLinkAnchorProps extends ComponentProps<'a'> {
  tone?: TextLinkTone;
  inline?: boolean;
}
