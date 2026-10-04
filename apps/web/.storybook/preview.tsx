import { Locale } from '@agent-ic/contracts';
import type { Preview } from '@storybook/react-vite';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import '@/shared/styles';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { applyResolvedTheme } from '@/shared/theme/helpers/theme.helpers';

const i18n = createI18n(Locale.En);
const THEME_GLOBAL = 'theme';
const THEME_TOOLBAR_TITLE = 'Theme';
const THEME_TOOLBAR_ICON = 'mirror';

const isResolvedTheme = (value: unknown): value is ResolvedTheme =>
  value === ResolvedTheme.Light || value === ResolvedTheme.Dark;

const preview: Preview = {
  globalTypes: {
    [THEME_GLOBAL]: {
      description: THEME_TOOLBAR_TITLE,
      toolbar: {
        title: THEME_TOOLBAR_TITLE,
        icon: THEME_TOOLBAR_ICON,
        items: Object.values(ResolvedTheme),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: {
    [THEME_GLOBAL]: ResolvedTheme.Light,
  },
  decorators: [
    (Story, context) => {
      const theme: unknown = context.globals[THEME_GLOBAL];
      applyResolvedTheme(
        document.documentElement,
        isResolvedTheme(theme) ? theme : ResolvedTheme.Light,
      );
      return (
        <I18nextProvider i18n={i18n}>
          <Story />
        </I18nextProvider>
      );
    },
  ],
  parameters: {
    layout: 'centered',
  },
};

export default preview;
