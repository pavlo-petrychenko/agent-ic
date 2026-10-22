import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PromptTestSampleKind } from '@/features/prompts/typedefs/promptTest.typedefs';
import { PromptTestPanel } from '@/features/prompts/view/PromptTestPanel';
import type { PromptTestPanelProps } from '@/features/prompts/view/PromptTestPanel/PromptTestPanel.typedefs';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const OUTPUT_JSON = JSON.stringify(
  { messages: ['Hi Olena! A gel manicure takes about 75 minutes.'] },
  null,
  2,
);

const baseProps = (): PromptTestPanelProps => ({
  versionLabel: 'v5 draft',
  variables: [
    { path: 'user.name', kind: PromptTestSampleKind.Text, value: 'Olena' },
    { path: 'channel', kind: PromptTestSampleKind.Channel, value: 'telegram' },
    { path: 'today', kind: PromptTestSampleKind.Today, value: 'Fri, Oct 2' },
  ],
  onVariableChange: vi.fn<(path: string, value: string) => void>(),
  customerMessage: 'How long does a gel manicure take?',
  onCustomerMessageChange: vi.fn<(message: string) => void>(),
  models: [
    { id: 'gpt-6-luna', label: 'GPT-6 Luna', defaultFor: ['conversation'] },
    { id: 'ministral-14b-2512', label: 'Ministral 14B', defaultFor: ['light'] },
  ],
  modelsLoading: false,
  model: 'gpt-6-luna',
  onModelChange: vi.fn<(model: string) => void>(),
  running: false,
  result: null,
  failed: false,
  canRun: true,
  workspaceId: 'wsp_1',
  onClose: vi.fn<() => void>(),
  onRun: vi.fn<() => void>(),
});

const renderPanel = async (props: PromptTestPanelProps = baseProps()) => {
  renderWithProviders(
    <MemoryRouter>
      <PromptTestPanel {...props} />
    </MemoryRouter>,
  );
  await screen.findByRole('complementary', { name: 'Test the prompt' });
};

describe('PromptTestPanel', () => {
  it('shows the prompt version subtitle and the sample fields', async () => {
    await renderPanel();

    expect(screen.getByText('v5 draft')).toBeInTheDocument();
    expect(screen.getByLabelText('user.name')).toHaveValue('Olena');
    expect(screen.getByLabelText('channel')).toHaveValue('telegram');
    expect(screen.getByLabelText('today')).toHaveValue('Fri, Oct 2');
  });

  it('renders the channel samples side by side under one group', async () => {
    await renderPanel();

    expect(document.querySelector('div[class*="pair"]')).not.toBeNull();
  });

  it('fills the customer message and picks a model before running', async () => {
    const props = baseProps();
    await renderPanel({ ...props, customerMessage: '', canRun: false });

    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Customer message/), {
      target: { value: 'Do you have gel polish?' },
    });
    expect(props.onCustomerMessageChange).toHaveBeenCalledWith('Do you have gel polish?');
  });

  it('runs the test from the button', async () => {
    const props = baseProps();
    await renderPanel(props);

    fireEvent.click(screen.getByRole('button', { name: 'Run' }));
    expect(props.onRun).toHaveBeenCalledTimes(1);
  });

  it('shows the output with duration and tokens', async () => {
    await renderPanel({
      ...baseProps(),
      result: {
        outputJson: OUTPUT_JSON,
        model: 'gpt-6-luna',
        durationLabel: '1.1 s',
        tokensCount: 642,
      },
    });

    expect(screen.getByText('Output · 1.1 s · 642 tokens')).toBeInTheDocument();
    expect(screen.getByText(/Hi Olena! A gel manicure/)).toBeInTheDocument();
  });

  it('disables the run button while the test runs', async () => {
    await renderPanel({ ...baseProps(), running: true });

    expect(screen.getByRole('button', { name: 'Run' })).toBeDisabled();
  });

  it('shows the error callout when the test fails', async () => {
    await renderPanel({ ...baseProps(), failed: true, result: null });

    expect(screen.getByText('The test failed. Try again.')).toBeInTheDocument();
  });

  it('reports the sample change and the model choice', async () => {
    const props = baseProps();
    await renderPanel(props);

    fireEvent.change(screen.getByLabelText('user.name'), { target: { value: 'Mariia' } });
    expect(props.onVariableChange).toHaveBeenCalledWith('user.name', 'Mariia');

    fireEvent.change(screen.getByLabelText('Model'), { target: { value: 'ministral-14b-2512' } });
    expect(props.onModelChange).toHaveBeenCalledWith('ministral-14b-2512');
  });

  it('closes the panel and links to the simulator', async () => {
    const props = baseProps();
    await renderPanel(props);

    fireEvent.click(screen.getByRole('button', { name: 'Close test' }));
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'use the simulator' })).toHaveAttribute(
      'href',
      '/w/wsp_1/testing',
    );
  });
});
