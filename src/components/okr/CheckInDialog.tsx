'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { KeyResultType, MilestoneStatus } from '@prisma/client'
import { KeyResultWithProgress } from '@/types/okr'
import { useToast } from '@/components/ui/use-toast'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const checkInSchema = z.object({
  currentValue: z.number().optional(),
  milestoneStatus: z.nativeEnum(MilestoneStatus).optional(),
  progress: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1).optional(),
  comment: z.string().optional(),
  blockers: z.string().optional()
})

type CheckInForm = z.infer<typeof checkInSchema>

interface CheckInDialogProps {
  keyResult: KeyResultWithProgress
  onClose: () => void
  onSuccess: () => void
}

export function CheckInDialog({
  keyResult,
  onClose,
  onSuccess
}: CheckInDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<CheckInForm>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      currentValue: keyResult.currentValue || keyResult.startValue || 0,
      milestoneStatus: keyResult.milestoneStatus || MilestoneStatus.NOT_STARTED,
      progress: keyResult.progress,
      confidence: keyResult.confidence || 0.7,
      comment: '',
      blockers: ''
    }
  })

  const progress = form.watch('progress')
  const confidence = form.watch('confidence')

  const onSubmit = async (data: CheckInForm) => {
    setIsSubmitting(true)
    
    try {
      const checkInData: any = {
        keyResultId: keyResult.id,
        progress: data.progress,
        confidence: data.confidence,
        comment: data.comment,
        blockers: data.blockers
      }

      if (keyResult.type === KeyResultType.METRIC) {
        checkInData.currentValue = data.currentValue
      }

      const response = await fetch('/api/okr/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkInData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create check-in')
      }

      // Update milestone status if it's a milestone type
      if (keyResult.type === KeyResultType.MILESTONE && data.milestoneStatus) {
        await fetch(`/api/okr/key-results/${keyResult.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ milestoneStatus: data.milestoneStatus })
        })
      }

      toast({
        title: 'Check-in recorded',
        description: 'Your progress has been updated successfully.'
      })
      
      onSuccess()
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to record check-in',
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
          <DialogTitle>Weekly Check-In</DialogTitle>
          <DialogDescription>
            Update the progress for: <strong>{keyResult.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {keyResult.type === KeyResultType.METRIC ? (
              <FormField
                control={form.control}
                name="currentValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Value</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value)
                            field.onChange(value)
                            
                            // Auto-calculate progress
                            if (keyResult.targetValue && keyResult.startValue !== undefined) {
                              const range = keyResult.targetValue - keyResult.startValue
                              const current = value - keyResult.startValue
                              const calculatedProgress = Math.min(Math.max(current / range, 0), 1)
                              form.setValue('progress', calculatedProgress)
                            }
                          }}
                        />
                        <span className="text-sm text-muted-foreground">
                          / {keyResult.targetValue} {keyResult.unit}
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Started at: {keyResult.startValue || 0} {keyResult.unit}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="milestoneStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Milestone Status</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(value) => {
                        field.onChange(value)
                        
                        // Auto-calculate progress based on status
                        const progressMap = {
                          [MilestoneStatus.NOT_STARTED]: 0,
                          [MilestoneStatus.IN_PROGRESS]: 0.5,
                          [MilestoneStatus.AT_RISK]: 0.3,
                          [MilestoneStatus.COMPLETED]: 1,
                          [MilestoneStatus.CANCELLED]: 0
                        }
                        form.setValue('progress', progressMap[value as MilestoneStatus])
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={MilestoneStatus.NOT_STARTED}>Not Started</SelectItem>
                        <SelectItem value={MilestoneStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={MilestoneStatus.AT_RISK}>At Risk</SelectItem>
                        <SelectItem value={MilestoneStatus.COMPLETED}>Completed</SelectItem>
                        <SelectItem value={MilestoneStatus.CANCELLED}>Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress: {Math.round((progress || 0) * 100)}%</FormLabel>
                  <FormControl>
                    <Slider
                      value={[field.value * 100]}
                      onValueChange={([value]) => field.onChange(value / 100)}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    Manually adjust if the calculated progress doesn't reflect reality
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confidence"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Confidence: {confidence ? Math.round(confidence * 100) : 0}%
                  </FormLabel>
                  <FormControl>
                    <Slider
                      value={[(field.value || 0) * 100]}
                      onValueChange={([value]) => field.onChange(value / 100)}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                  </FormControl>
                  <FormDescription>
                    How confident are you in achieving this key result by the end of the quarter?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Update Comment</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What progress was made this week? Any wins to celebrate?"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="blockers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Blockers or Challenges</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What obstacles are preventing progress? What help do you need?"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {confidence && confidence < 0.5 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Low confidence detected. Consider discussing this key result with your team or manager.
                </AlertDescription>
              </Alert>
            )}

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
                {isSubmitting ? 'Saving...' : 'Save Check-In'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}