import type { Meta, StoryObj } from '@storybook/react-vite';
import { Link } from '@/shared/ui/Link/Link';
import { withMemoryRouter } from '@test/support/helpers/storybook.helpers';

const meta = {
  component: Link,
  decorators: [withMemoryRouter],
  args: { to: '/', children: 'Back to the status page' },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
