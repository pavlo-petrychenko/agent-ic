import type { Meta, StoryObj } from '@storybook/react-vite';
import { DropZone } from '@/shared/ui/inputs/DropZone/DropZone';

const meta = {
  component: DropZone,
  args: {
    title: 'Drop files here or',
    dragTitle: (count: number) => `Drop to upload ${count} files`,
    browseLabel: 'browse',
    hint: 'PDF, DOCX, TXT, Markdown',
    accept: ['.pdf', '.docx', '.txt', '.md'],
    onFiles: () => undefined,
    formatResult: (count: number) => `${count} files added`,
  },
  argTypes: { onFiles: { action: 'files' } },
} satisfies Meta<typeof DropZone>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const SingleFile: Story = { args: { multiple: false, hint: 'One PDF, up to 20 MB' } };
export const Disabled: Story = { args: { disabled: true } };
export const DragOver: Story = {
  play: ({ canvasElement }) => {
    const zone = canvasElement.querySelector('button')?.parentElement;
    zone?.dispatchEvent(
      new DragEvent('dragover', {
        bubbles: true,
        cancelable: true,
        dataTransfer: new DataTransfer(),
      }),
    );
  },
};
export const WithError: Story = {
  args: { error: "Price list.xlsx isn't supported. Use PDF, DOCX, TXT or MD" },
};
