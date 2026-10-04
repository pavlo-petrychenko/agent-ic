import { render, toPlainText } from '@react-email/render';
import type { ReactElement } from 'react';
import type { RenderedEmail } from '@/modules/notifications/typedefs/email.typedefs';

export const renderEmail = async (element: ReactElement): Promise<RenderedEmail> => {
  const html = await render(element);
  return { html, text: toPlainText(html) };
};
