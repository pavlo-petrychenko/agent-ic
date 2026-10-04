import { Locale } from '@agent-ic/contracts';
import type { Preview } from '@storybook/react-vite';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import '@/shared/styles';

const i18n = createI18n(Locale.En);

const preview: Preview = {
  decorators: [
    (Story) => (
      <I18nextProvider i18n={i18n}>
        <Story />
      </I18nextProvider>
    ),
  ],
  parameters: {
    layout: 'centered',
  },
};

export default preview;
