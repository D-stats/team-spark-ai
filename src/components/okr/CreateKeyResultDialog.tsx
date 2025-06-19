'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { KeyResultType, MilestoneStatus } from '@prisma/client'
import { useToast } from '@/components/ui/use-toast'

const createKeyResultSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  type: z.nativeEnum(KeyResultType),
  // For METRIC type
  startValue: z.number().optional(),
  targetValue: z.number().optional(),
  unit: z.string().optional(),
  // For MILESTONE type
  milestoneStatus: z.nativeEnum(MilestoneStatus).optional()
}).refine((data) => {
  if (data.type === KeyResultType.METRIC) {
    return data.targetValue !== undefined && data.targetValue !== null
  }
  return true
}, {
  message: "Target value is required for metric key results",
  path: ["targetValue"]
})

type CreateKeyResultForm = z.infer<typeof createKeyResultSchema>

interface CreateKeyResultDialogProps {
  objectiveId: string
  onClose: () => void
  onSuccess: () => void
}

export function CreateKeyResultDialog({
  objectiveId,
  onClose,
  onSuccess
}: CreateKeyResultDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CreateKeyResultForm>({
    resolver: zodResolver(createKeyResultSchema),
    defaultValues: {
      title: '',
      description: '',
      type: KeyResultType.METRIC,
      startValue: 0,
      targetValue: undefined,
      unit: '',
      milestoneStatus: MilestoneStatus.NOT_STARTED
    }
  })

  const keyResultType = form.watch('type')

  const onSubmit = async (data: CreateKeyResultForm) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/okr/key-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objectiveId,
          ...data
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create key result')
      }

      toast({
        title: 'Key result created',
        description: 'Your key result has been created successfully.'
      })
      
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create key result',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Key Result</DialogTitle>
          <DialogDescription>
            Define a measurable outcome that will help achieve your objective.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Result Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Increase NPS score from 30 to 50"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    A specific, measurable outcome
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
                      placeholder="Add more context or details about this key result"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Tabs value={field.value} onValueChange={field.onChange}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value={KeyResultType.METRIC}>Metric</TabsTrigger>
                      <TabsTrigger value={KeyResultType.MILESTONE}>Milestone</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value={KeyResultType.METRIC} className="space-y-4">
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="startValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Start Value</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="targetValue"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Target Value</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="100"
                                  {...field}
                                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="%,#,¥"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value={KeyResultType.MILESTONE} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="milestoneStatus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Initial Status</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={MilestoneStatus.NOT_STARTED}>Not Started</SelectItem>
                                <SelectItem value={MilestoneStatus.IN_PROGRESS}>In Progress</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TabsContent>
                  </Tabs>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Key Result'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}