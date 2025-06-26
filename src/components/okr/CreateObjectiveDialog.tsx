'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { ObjectiveOwner, OkrCycle } from '@prisma/client';
import { getCurrentQuarter, getQuarterDates } from '@/types/okr';
import { useToast } from '@/components/ui/use-toast';

const createObjectiveSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  ownerType: z.nativeEnum(ObjectiveOwner),
  ownerUserId: z.string().optional(),
  ownerTeamId: z.string().optional(),
  parentId: z.string().optional(),
  cycle: z.nativeEnum(OkrCycle),
  year: z.number().int().min(2024).max(2100),
});

type CreateObjectiveForm = z.infer<typeof createObjectiveSchema>;

interface CreateObjectiveDialogProps {
  organizationId: string;
  defaultOwnerType?: ObjectiveOwner;
  defaultOwnerUserId?: string;
  defaultOwnerTeamId?: string;
  parentObjective?: { id: string; title: string };
  teams?: Array<{ id: string; name: string }>;
  companyObjectives?: Array<{ id: string; title: string }>;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateObjectiveDialog({
  _organizationId,
  defaultOwnerType = ObjectiveOwner.INDIVIDUAL,
  defaultOwnerUserId,
  defaultOwnerTeamId,
  parentObjective,
  teams = [],
  companyObjectives = [],
  onClose,
  onSuccess,
}: CreateObjectiveDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  const form = useForm<CreateObjectiveForm>({
    resolver: zodResolver(createObjectiveSchema),
    defaultValues: {
      title: '',
      description: '',
      ownerType: defaultOwnerType,
      ownerUserId: defaultOwnerUserId,
      ownerTeamId: defaultOwnerTeamId,
      parentId: parentObjective?.id,
      cycle: currentQuarter,
      year: currentYear,
    },
  });

  const _selectedCycle = form.watch('cycle');
  const _selectedYear = form.watch('year');
  const ownerType = form.watch('ownerType');

  const onSubmit = async (data: CreateObjectiveForm) => {
    setIsSubmitting(true);

    try {
      const { start, end } = getQuarterDates(data.year, data.cycle);

      const response = await fetch('/api/okr/objectives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create objective');
      }

      toast({
        title: 'Objective created',
        description: 'Your objective has been created successfully.',
      });

      onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create objective',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Objective</DialogTitle>
          <DialogDescription>
            Set a clear, measurable objective for your organization, team, or yourself.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objective Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Improve customer satisfaction" {...field} />
                  </FormControl>
                  <FormDescription>
                    A clear, inspirational statement of what you want to achieve
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add more context or details about this objective"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ownerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner Type</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={ObjectiveOwner.COMPANY}>Company</SelectItem>
                        <SelectItem value={ObjectiveOwner.TEAM}>Team</SelectItem>
                        <SelectItem value={ObjectiveOwner.INDIVIDUAL}>Individual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {ownerType === ObjectiveOwner.TEAM && teams.length > 0 && (
                <FormField
                  control={form.control}
                  name="ownerTeamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teams.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cycle</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={OkrCycle.ANNUAL}>Annual</SelectItem>
                        <SelectItem value={OkrCycle.Q1}>Q1</SelectItem>
                        <SelectItem value={OkrCycle.Q2}>Q2</SelectItem>
                        <SelectItem value={OkrCycle.Q3}>Q3</SelectItem>
                        <SelectItem value={OkrCycle.Q4}>Q4</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2024}
                        max={2100}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {(ownerType === ObjectiveOwner.TEAM || ownerType === ObjectiveOwner.INDIVIDUAL) &&
              companyObjectives.length > 0 && (
                <FormField
                  control={form.control}
                  name="parentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Align to Company Objective (optional)</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company objective" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">None</SelectItem>
                          {companyObjectives.map((objective) => (
                            <SelectItem key={objective.id} value={objective.id}>
                              {objective.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Link this objective to a company objective for better alignment
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Objective'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
