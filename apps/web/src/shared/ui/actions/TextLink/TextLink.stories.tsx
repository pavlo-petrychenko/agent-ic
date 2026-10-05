import type { Meta, StoryObj } from '@storybook/react-vite';
import { TextLink } from '@/shared/ui/actions/TextLink/TextLink';
import { TextLinkTone } from '@/shared/ui/actions/TextLink/TextLink.constants';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';

const meta = {
  component: TextLink,
  decorators: [withMemoryRouter],
  args: { to: '/', children: 'Back to the status page' },
  argTypes: {
    tone: { control: 'select', options: Object.values(TextLinkTone) },
  },
} satisfies Meta<typeof TextLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Accent: Story = { args: { tone: TextLinkTone.Accent } };
export const ErrorTone: Story = { args: { tone: TextLinkTone.Error, children: 'Reconnect' } };
export const Disabled: Story = { args: { disabled: true } };
export const InlineInSentence: Story = {
  args: { inline: true, children: 'read the guide' },
  render: (args) => (
    <p>
      To learn more, <TextLink {...args} /> before publishing.
    </p>
  ),
};
