'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Plus, Target, TrendingUp, Users, Building2 } from 'lucide-react';
import {
  ObjectiveWithRelations,
  calculateObjectiveProgress,
  calculateConfidence,
  getProgressColor,
} from '@/types/okr';
import { KeyResultCard } from './KeyResultCard';
import { CreateKeyResultDialog } from './CreateKeyResultDialog';
import { ObjectiveOwner, ObjectiveStatus } from '@prisma/client';

interface ObjectiveCardProps {
  objective: ObjectiveWithRelations;
  onUpdate?: () => void;
  showActions?: boolean;
}

export function ObjectiveCard({ objective, onUpdate, showActions = true }: ObjectiveCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCreateKeyResult, setShowCreateKeyResult] = useState(false);

  const progress = calculateObjectiveProgress(objective);
  const confidence = calculateConfidence(objective);

  const getOwnerIcon = () => {
    switch (objective.ownerType) {
      case ObjectiveOwner.COMPANY:
        return <Building2 className="h-4 w-4" />;
      case ObjectiveOwner.TEAM:
        return <Users className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    const statusColors = {
      [ObjectiveStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [ObjectiveStatus.ACTIVE]: 'bg-blue-100 text-blue-800',
      [ObjectiveStatus.COMPLETED]: 'bg-green-100 text-green-800',
      [ObjectiveStatus.CANCELLED]: 'bg-red-100 text-red-800',
    };

    return <Badge className={statusColors[objective.status]}>{objective.status}</Badge>;
  };

  return (
    <>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                {getOwnerIcon()}
                <span className="text-sm text-muted-foreground">
                  {objective.ownerType === ObjectiveOwner.TEAM && objective.ownerTeam?.name}
                  {objective.ownerType === ObjectiveOwner.INDIVIDUAL && objective.ownerUser?.name}
                  {objective.ownerType === ObjectiveOwner.COMPANY && objective.organization.name}
                </span>
                {getStatusBadge()}
              </div>
              <CardTitle className="text-lg">{objective.title}</CardTitle>
              {objective.description && (
                <CardDescription className="mt-2">{objective.description}</CardDescription>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              {isExpanded ? <ChevronUp /> : <ChevronDown />}
            </Button>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span className={getProgressColor(progress)}>{Math.round(progress * 100)}%</span>
            </div>
            <Progress value={progress * 100} className="h-2" />

            {confidence > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <TrendingUp className="h-3 w-3" />
                <span>Confidence: {Math.round(confidence * 100)}%</span>
              </div>
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent>
            <div className="space-y-3">
              {objective.keyResults.map((keyResult) => (
                <KeyResultCard key={keyResult.id} keyResult={keyResult} onUpdate={onUpdate} />
              ))}

              {showActions && objective.status === ObjectiveStatus.ACTIVE && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => setShowCreateKeyResult(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Key Result
                </Button>
              )}
            </div>

            {objective.parent && (
              <div className="mt-4 border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Aligned to: <span className="font-medium">{objective.parent.title}</span>
                </p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {showCreateKeyResult && (
        <CreateKeyResultDialog
          objectiveId={objective.id}
          onClose={() => setShowCreateKeyResult(false)}
          onSuccess={() => {
            setShowCreateKeyResult(false);
            onUpdate?.();
          }}
        />
      )}
    </>
  );
}
