import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WizardFrame } from '@/shared/ui/WizardFrame/WizardFrame';
import { createFakeViewport } from '@test/support/helpers/viewport.helpers';

const WIDE_WIDTH = 1500;
const COMPACT_WIDTH = 1100;

const STEPS = [
  { id: 'template', label: 'Template' },
  { id: 'knowledge', label: 'Knowledge' },
  { id: 'publish', label: 'Publish' },
];

interface RenderOptions {
  width: number;
  side?: boolean;
  onExit?: () => void;
}

function renderWizard({ width, side = true, onExit = vi.fn<() => void>() }: RenderOptions) {
  vi.stubGlobal('matchMedia', createFakeViewport(width).matchMedia);
  render(
    <WizardFrame
      title="Demo salon assistant"
      subtitle="New agent"
      steps={STEPS}
      current={1}
      stepperLabel="Setup progress"
      stepCompletedLabel="completed"
      exitLabel="Exit"
      onExit={onExit}
      side={side ? <p>Try it as you go</p> : null}
      previewLabel="Preview"
      footerLeft={<button type="button">Back</button>}
      footerRight={<button type="button">Continue</button>}
    >
      <p>Add your documents</p>
    </WizardFrame>,
  );
  return onExit;
}

describe('WizardFrame', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('lays out the title, steps, content, footer actions and exit', async () => {
    const onExit = renderWizard({ width: WIDE_WIDTH });

    expect(
      screen.getByRole('heading', { level: 1, name: 'Demo salon assistant' }),
    ).toBeInTheDocument();
    expect(screen.getByText('New agent')).toBeInTheDocument();
    const steps = screen.getByRole('list', { name: 'Setup progress' });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(STEPS.length);
    expect(screen.getByRole('main')).toHaveTextContent('Add your documents');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Back');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Continue');

    await userEvent.click(screen.getByRole('button', { name: 'Exit' }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it('docks the preview as a side panel when there is room', () => {
    renderWizard({ width: WIDE_WIDTH });

    expect(screen.getByRole('complementary', { name: 'Preview' })).toHaveTextContent(
      'Try it as you go',
    );
    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
  });

  it('moves the preview behind a button that opens a drawer at compact widths', async () => {
    renderWizard({ width: COMPACT_WIDTH });

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Preview' }));
    expect(screen.getByRole('complementary', { name: 'Preview' })).toHaveTextContent(
      'Try it as you go',
    );

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('has no preview and no preview button without a side', () => {
    renderWizard({ width: COMPACT_WIDTH, side: false });

    expect(screen.queryByRole('button', { name: 'Preview' })).not.toBeInTheDocument();
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
