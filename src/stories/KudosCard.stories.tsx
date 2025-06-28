import type { Meta, StoryObj } from '@storybook/nextjs';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// Type definitions for the story
interface KudosData {
  id: string;
  sender: { id: string; name: string; avatarUrl: string };
  receiver: { id: string; name: string };
  message: string;
  category: { id: string; name: string; emoji: string };
  points: number;
  timeAgo: string;
  reactions: number;
  comments: number;
}

// Mock KudosCard component
const KudosCard = ({ kudos }: { kudos: KudosData }) => {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={kudos.sender.avatarUrl} />
              <AvatarFallback>{kudos.sender.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{kudos.sender.name}</p>
              <p className="text-xs text-muted-foreground">to {kudos.receiver.name}</p>
            </div>
          </div>
          <Badge variant="secondary">
            {kudos.category.emoji} {kudos.category.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{kudos.message}</p>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{kudos.points} points</span>
          <span>{kudos.timeAgo}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">
            👏 {kudos.reactions}
          </Button>
          <Button variant="ghost" size="sm">
            💬 {kudos.comments}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

const meta = {
  title: 'Features/KudosCard',
  component: KudosCard,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof KudosCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default kudos
export const Default: Story = {
  args: {
    kudos: {
      id: '1',
      sender: {
        id: '1',
        name: 'Sarah Johnson',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
      },
      receiver: {
        id: '2',
        name: 'Mike Chen',
      },
      message:
        'Great job on the product launch! Your attention to detail and leadership really made a difference.',
      category: {
        id: '1',
        name: 'Achievement',
        emoji: '🎯',
      },
      points: 10,
      timeAgo: '2 hours ago',
      reactions: 5,
      comments: 2,
    },
  },
};

// Teamwork kudos
export const TeamworkKudos: Story = {
  args: {
    kudos: {
      id: '2',
      sender: {
        id: '3',
        name: 'Alex Kim',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
      },
      receiver: {
        id: '4',
        name: 'Emma Wilson',
      },
      message:
        'Thanks for staying late to help debug that critical issue. Your teamwork saved the day!',
      category: {
        id: '2',
        name: 'Teamwork',
        emoji: '🤝',
      },
      points: 15,
      timeAgo: '1 day ago',
      reactions: 12,
      comments: 5,
    },
  },
};

// Innovation kudos
export const InnovationKudos: Story = {
  args: {
    kudos: {
      id: '3',
      sender: {
        id: '5',
        name: 'David Park',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
      },
      receiver: {
        id: '6',
        name: 'Lisa Zhang',
      },
      message:
        'Your innovative approach to solving the performance issue was brilliant! The new caching strategy is working perfectly.',
      category: {
        id: '3',
        name: 'Innovation',
        emoji: '💡',
      },
      points: 20,
      timeAgo: 'Just now',
      reactions: 0,
      comments: 0,
    },
  },
};

// Multiple kudos cards
export const KudosFeed: Story = {
  args: {
    kudos: {
      id: '1',
      sender: { id: '1', name: 'Default', avatarUrl: '' },
      receiver: { id: '2', name: 'Default' },
      message: 'Default message',
      category: { id: '1', name: 'Default', emoji: '🎯' },
      points: 10,
      timeAgo: 'now',
      reactions: 0,
      comments: 0,
    },
  },
  render: () => {
    const kudosList = [
      {
        id: '1',
        sender: {
          id: '1',
          name: 'Sarah Johnson',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
        },
        receiver: { id: '2', name: 'Mike Chen' },
        message: 'Excellent presentation at the all-hands meeting!',
        category: { id: '1', name: 'Leadership', emoji: '🚀' },
        points: 10,
        timeAgo: '5 min ago',
        reactions: 3,
        comments: 1,
      },
      {
        id: '2',
        sender: {
          id: '3',
          name: 'Alex Kim',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
        },
        receiver: { id: '4', name: 'Emma Wilson' },
        message: 'Thanks for mentoring the new team members!',
        category: { id: '2', name: 'Learning', emoji: '📚' },
        points: 15,
        timeAgo: '1 hour ago',
        reactions: 8,
        comments: 3,
      },
      {
        id: '3',
        sender: {
          id: '5',
          name: 'David Park',
          avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
        },
        receiver: { id: '6', name: 'Lisa Zhang' },
        message: 'Your creativity in the design sprint was inspiring!',
        category: { id: '3', name: 'Creativity', emoji: '🎨' },
        points: 12,
        timeAgo: '3 hours ago',
        reactions: 15,
        comments: 7,
      },
    ];

    return (
      <div className="w-full max-w-md space-y-4">
        {kudosList.map((kudos) => (
          <KudosCard key={kudos.id} kudos={kudos} />
        ))}
      </div>
    );
  },
};
