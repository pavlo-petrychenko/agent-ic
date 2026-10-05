import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthFrame } from '@/shared/ui/layout/AuthFrame/AuthFrame';
import { AuthCardSize } from '@/shared/ui/layout/AuthFrame/AuthFrame.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/layout/AuthFrame/AuthFrame.module.scss';

describe('AuthFrame', () => {
  it('shows the brand, the card content in the main landmark and the footer', () => {
    render(
      <AuthFrame
        brandName="Agents"
        title="Log in"
        subtitle="Welcome back"
        footer={<a href="/terms">Terms</a>}
      >
        <button type="button">Continue</button>
      </AuthFrame>,
    );

    expect(screen.getByText('Agents')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByRole('main')).toContainElement(
      screen.getByRole('button', { name: 'Continue' }),
    );
    expect(screen.getByRole('contentinfo')).toContainElement(
      screen.getByRole('link', { name: 'Terms' }),
    );
  });

  it('leaves out the heading and the footer when it is not given them', () => {
    render(
      <AuthFrame brandName="Agents">
        <p>Form</p>
      </AuthFrame>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('contentinfo')).not.toBeInTheDocument();
  });

  it('uses the medium card width by default and the large one on request', () => {
    const { rerender } = render(
      <AuthFrame brandName="Agents">
        <p>Form</p>
      </AuthFrame>,
    );
    expect(screen.getByRole('main')).toHaveClass(cssClass(styles.md));

    rerender(
      <AuthFrame brandName="Agents" size={AuthCardSize.Lg}>
        <p>Form</p>
      </AuthFrame>,
    );
    expect(screen.getByRole('main')).toHaveClass(cssClass(styles.lg));
  });
});
