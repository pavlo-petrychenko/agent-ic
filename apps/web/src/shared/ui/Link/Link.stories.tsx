import type { Meta, StoryObj } from '@storybook/react-vite';

import { withMemoryRouter } from '@/shared/testing/withMemoryRouter';

import { Link } from './Link';

const meta = {
  component: Link,
  decorators: [withMemoryRouter],
  args: { to: '/', children: 'Back to the status page' },
} satisfies Meta<typeof Link>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
