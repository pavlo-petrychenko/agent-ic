import type { Meta, StoryObj } from '@storybook/react-vite';
import { CodeBlock } from '@/shared/ui/CodeBlock/CodeBlock';
import { CodeTone } from '@/shared/ui/CodeBlock/CodeBlock.constants';

const JSON_SAMPLE = JSON.stringify(
  { order_id: 'A-1042', status: 'shipped', eta: '2026-10-07', items: [{ sku: 'TEA-01', qty: 2 }] },
  null,
  2,
);

const LONG_LINE = `curl -X POST https://api.example.com/v1/orders/A-1042/cancel -H "Authorization: Bearer <token>" -H "Content-Type: application/json" -d '{"reason":"customer_request"}'`;

const meta = {
  component: CodeBlock,
  args: { code: JSON_SAMPLE, language: 'json' },
  argTypes: {
    tone: { control: 'select', options: Object.values(CodeTone) },
    wrap: { control: 'select', options: [null, true, false] },
  },
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Light: Story = { args: { tone: CodeTone.Light } };
export const Dark: Story = { args: { tone: CodeTone.Dark } };
export const LightWrapping: Story = { args: { tone: CodeTone.Light, code: LONG_LINE } };
export const DarkScrolling: Story = { args: { tone: CodeTone.Dark, code: LONG_LINE } };
export const DarkWrapping: Story = { args: { tone: CodeTone.Dark, code: LONG_LINE, wrap: true } };
export const WithCopyButton: Story = { args: { tone: CodeTone.Dark, copyLabel: 'Copy code' } };
export const LightWithCopyButton: Story = {
  args: { tone: CodeTone.Light, copyLabel: 'Copy code' },
};
