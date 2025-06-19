'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { BarChart3, CheckCircle2, Clock, MessageSquare, TrendingUp } from 'lucide-react'
import { KeyResultWithProgress, getProgressColor, getConfidenceLabel } from '@/types/okr'
import { KeyResultType, MilestoneStatus } from '@prisma/client'
import { CheckInDialog } from './CheckInDialog'
import { formatDistanceToNow } from 'date-fns'

interface KeyResultCardProps {
  keyResult: KeyResultWithProgress
  onUpdate?: () => void
}

export function KeyResultCard({ keyResult, onUpdate }: KeyResultCardProps) {
  const [showCheckIn, setShowCheckIn] = useState(false)

  const getMilestoneIcon = () => {
    switch (keyResult.milestoneStatus) {
      case MilestoneStatus.COMPLETED:
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case MilestoneStatus.IN_PROGRESS:
        return <Clock className="h-4 w-4 text-blue-600" />
      case MilestoneStatus.AT_RISK:
        return <Clock className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getMilestoneStatusBadge = () => {
    const statusColors = {
      [MilestoneStatus.NOT_STARTED]: 'bg-gray-100 text-gray-800',
      [MilestoneStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-800',
      [MilestoneStatus.AT_RISK]: 'bg-red-100 text-red-800',
      [MilestoneStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [MilestoneStatus.CANCELLED]: 'bg-gray-100 text-gray-800'
    }

    if (keyResult.milestoneStatus) {
      return (
        <Badge className={statusColors[keyResult.milestoneStatus]}>
          {keyResult.milestoneStatus.replace('_', ' ')}
        </Badge>
      )
    }
    return null
  }

  return (
    <>
      <Card>
        <CardContent className="pt-4">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  {keyResult.type === KeyResultType.METRIC ? (
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    getMilestoneIcon()
                  )}
                  <h4 className="font-medium">{keyResult.title}</h4>
                </div>
                {keyResult.description && (
                  <p className="text-sm text-muted-foreground mt-1">{keyResult.description}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCheckIn(true)}
              >
                Check In
              </Button>
            </div>

            {keyResult.type === KeyResultType.METRIC ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>
                    {keyResult.currentValue || keyResult.startValue || 0} / {keyResult.targetValue} {keyResult.unit}
                  </span>
                  <span className={getProgressColor(keyResult.progress)}>
                    {Math.round(keyResult.progress * 100)}%
                  </span>
                </div>
                <Progress value={keyResult.progress * 100} className="h-2" />
              </div>
            ) : (
              <div>{getMilestoneStatusBadge()}</div>
            )}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-4">
                {keyResult.confidence !== null && (
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Confidence: {getConfidenceLabel(keyResult.confidence)}</span>
                  </div>
                )}
                {keyResult.owner && (
                  <span>Owner: {keyResult.owner.name}</span>
                )}
              </div>
              {keyResult.latestCheckIn && (
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  <span>
                    Updated {formatDistanceToNow(new Date(keyResult.latestCheckIn.createdAt), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showCheckIn && (
        <CheckInDialog
          keyResult={keyResult}
          onClose={() => setShowCheckIn(false)}
          onSuccess={() => {
            setShowCheckIn(false)
            onUpdate?.()
          }}
        />
      )}
    </>
  )
}