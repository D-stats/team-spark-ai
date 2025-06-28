import type { Meta, StoryObj } from '@storybook/nextjs';
import { Badge } from './badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'secondary', 'destructive', 'outline'],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default badge
export const Default: Story = {
  args: {
    children: 'Badge',
  },
};

// Badge variants
export const Secondary: Story = {
  args: {
    children: 'Secondary',
    variant: 'secondary',
  },
};

export const Destructive: Story = {
  args: {
    children: 'Destructive',
    variant: 'destructive',
  },
};

export const Outline: Story = {
  args: {
    children: 'Outline',
    variant: 'outline',
  },
};

// Status badges
export const StatusBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="default">Active</Badge>
      <Badge variant="secondary">Pending</Badge>
      <Badge variant="destructive">Inactive</Badge>
      <Badge variant="outline">Draft</Badge>
    </div>
  ),
};

// Role badges
export const RoleBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="default">Admin</Badge>
      <Badge variant="secondary">Manager</Badge>
      <Badge variant="outline">Member</Badge>
    </div>
  ),
};

// Kudos category badges
export const KudosCategoryBadges: Story = {
  render: () => (
    <div className="flex max-w-md flex-wrap gap-2">
      <Badge>🎯 Achievement</Badge>
      <Badge>🤝 Teamwork</Badge>
      <Badge>💡 Innovation</Badge>
      <Badge>🚀 Leadership</Badge>
      <Badge>📚 Learning</Badge>
      <Badge>🎨 Creativity</Badge>
    </div>
  ),
};

// Metric badges
export const MetricBadges: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="default">+12%</Badge>
      <Badge variant="secondary">Top 10%</Badge>
      <Badge variant="outline">New Record</Badge>
    </div>
  ),
};

// Badge in context
export const BadgeInContext: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">John Doe</span>
        <Badge variant="secondary">Manager</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Engineering Team</span>
        <Badge variant="default">12 members</Badge>
        <Badge variant="outline">Active</Badge>
      </div>
      <div className="flex items-center gap-2">
        <span className="font-medium">Q4 OKR Progress</span>
        <Badge variant="default">On Track</Badge>
        <Badge>85%</Badge>
      </div>
    </div>
  ),
};
