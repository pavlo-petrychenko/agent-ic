import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { ResolvedTheme } from '@/shared/theme/constants/theme.constants';
import { AuthFrame } from '@/shared/ui/AuthFrame/AuthFrame';
import { AuthCardSize } from '@/shared/ui/AuthFrame/AuthFrame.constants';
import { Button, ButtonSize } from '@/shared/ui/Button';
import { Field } from '@/shared/ui/Field';
import { Input } from '@/shared/ui/Input';
import { SegmentedControl, SegmentedControlSize } from '@/shared/ui/SegmentedControl';
import { TextLink } from '@/shared/ui/TextLink';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';
import styles from '@/shared/ui/AuthFrame/AuthFrame.module.scss';

const LANGUAGES = [
  { value: 'en', label: 'EN' },
  { value: 'uk', label: 'UK' },
];

function FooterLinks() {
  const [language, setLanguage] = useState('en');

  return (
    <>
      <TextLink to="/">Terms</TextLink>
      <TextLink to="/">Privacy</TextLink>
      <SegmentedControl
        ariaLabel="Language"
        size={SegmentedControlSize.Sm}
        options={LANGUAGES}
        value={language}
        onValueChange={setLanguage}
      />
    </>
  );
}

function LoginForm() {
  return (
    <form className={styles.storyForm}>
      <Field label="Email">
        {({ invalid, required, ...control }) => (
          <Input {...control} invalid={invalid} required={required} type="email" />
        )}
      </Field>
      <Field label="Password">
        {({ invalid, required, ...control }) => (
          <Input {...control} invalid={invalid} required={required} type="password" />
        )}
      </Field>
      <Button fullWidth size={ButtonSize.Lg}>
        Log in
      </Button>
    </form>
  );
}

const meta = {
  component: AuthFrame,
  parameters: { layout: 'fullscreen' },
  decorators: [withMemoryRouter],
  args: {
    brandName: 'Agents',
    title: 'Log in',
    subtitle: 'Welcome back to your workspace',
    footer: <FooterLinks />,
    children: <LoginForm />,
  },
  argTypes: {
    size: { control: 'select', options: Object.values(AuthCardSize) },
  },
} satisfies Meta<typeof AuthFrame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Medium: Story = { args: { size: AuthCardSize.Md } };
export const Large: Story = {
  args: {
    size: AuthCardSize.Lg,
    title: 'Create your workspace',
    subtitle: 'Set up in under a minute',
  },
};
export const WithoutHeading: Story = { args: { title: null, subtitle: null } };
export const WithoutFooter: Story = { args: { footer: null } };
export const Dark: Story = { globals: { theme: ResolvedTheme.Dark } };
