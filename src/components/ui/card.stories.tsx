import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
import { Button } from './button';

const meta = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic card
export const Default: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>Card description goes here</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Card content can be any React component or text.</p>
      </CardContent>
    </Card>
  ),
};

// Card with footer
export const WithFooter: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Team Update</CardTitle>
        <CardDescription>Weekly team performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>Kudos sent: 42</p>
          <p>Check-ins completed: 38/40</p>
          <p>Team satisfaction: 4.5/5</p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm">
          View Details
        </Button>
        <Button size="sm">Share Report</Button>
      </CardFooter>
    </Card>
  ),
};

// Kudos card example
export const KudosCard: Story = {
  render: () => (
    <Card className="w-[350px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Great job on the presentation!</CardTitle>
            <CardDescription>From: Sarah Johnson</CardDescription>
          </div>
          <span className="text-2xl">🎯</span>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Your presentation was clear, engaging, and really helped the team understand the new
          feature.
        </p>
      </CardContent>
      <CardFooter>
        <p className="text-xs text-muted-foreground">2 hours ago • 10 points</p>
      </CardFooter>
    </Card>
  ),
};

// Metric card
export const MetricCard: Story = {
  render: () => (
    <Card className="w-[300px]">
      <CardHeader className="pb-2">
        <CardDescription>Total Kudos This Month</CardDescription>
        <CardTitle className="text-4xl">1,234</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">+12% from last month</p>
      </CardContent>
    </Card>
  ),
};

// Interactive card
export const InteractiveCard: Story = {
  render: () => (
    <Card className="w-[350px] cursor-pointer transition-shadow hover:shadow-lg">
      <CardHeader>
        <CardTitle>Join Team Alpha</CardTitle>
        <CardDescription>Engineering • 12 members</CardDescription>
      </CardHeader>
      <CardContent>
        <p>A cross-functional team focused on building the next generation of our platform.</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full">Request to Join</Button>
      </CardFooter>
    </Card>
  ),
};

// Card grid example
export const CardGrid: Story = {
  render: () => (
    <div className="grid w-[900px] grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle>Team {i}</CardTitle>
            <CardDescription>Description for team {i}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Team information and metrics go here.</p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
