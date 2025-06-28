'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Plus, Target, Users, Building2 } from 'lucide-react';
import { ObjectiveOwner, OkrCycle, User, Organization } from '@prisma/client';
import { ObjectiveWithRelations, OkrAlignment, getCurrentQuarter } from '@/types/okr';
import { ObjectiveCard } from '@/components/okr/ObjectiveCard';
import { CreateObjectiveDialog } from '@/components/okr/CreateObjectiveDialog';
import { useToast } from '@/components/ui/use-toast';

interface OKRsDashboardProps {
  user: User & { organization: Organization };
  organization: Organization;
}

export function OKRsDashboard({ user, organization }: OKRsDashboardProps) {
  const { toast } = useToast();

  const [objectives, setObjectives] = useState<ObjectiveWithRelations[]>([]);
  const [alignment, setAlignment] = useState<OkrAlignment | null>(null);
  const [summary, setSummary] = useState<{
    totalObjectives: number;
    activeObjectives: number;
    completedObjectives: number;
    averageProgress: number;
    averageConfidence: number;
    keyResultsByType: {
      metric: number;
      milestone: number;
    };
    objectivesByCycle: Record<OkrCycle, number>;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedView, setSelectedView] = useState<'list' | 'alignment'>('list');

  const currentYear = new Date().getFullYear();
  const currentQuarter = getCurrentQuarter();

  const [selectedCycle, setSelectedCycle] = useState<OkrCycle>(currentQuarter);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedOwnerType, setSelectedOwnerType] = useState<ObjectiveOwner | 'all'>('all');

  const fetchObjectives = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString(),
        ...(selectedOwnerType !== 'all' && { ownerType: selectedOwnerType }),
      });

      const response = await fetch(`/api/okr/objectives?${params}`);
      if (!response.ok) throw new Error('Failed to fetch objectives');

      const data = await response.json();
      setObjectives(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load objectives',
        variant: 'destructive',
      });
    }
  }, [selectedCycle, selectedYear, selectedOwnerType, toast]);

  const fetchAlignment = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString(),
      });

      const response = await fetch(`/api/okr/alignment?${params}`);
      if (!response.ok) throw new Error('Failed to fetch alignment');

      const data = await response.json();
      setAlignment(data);
    } catch (error) {
      // Error fetching alignment
    }
  }, [selectedCycle, selectedYear]);

  const fetchSummary = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString(),
      });

      const response = await fetch(`/api/okr/summary?${params}`);
      if (!response.ok) throw new Error('Failed to fetch summary');

      const data = await response.json();
      setSummary(data);
    } catch (error) {
      // Error fetching summary
    }
  }, [selectedCycle, selectedYear]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchObjectives(), fetchAlignment(), fetchSummary()]);
      setLoading(false);
    };

    loadData();
  }, [
    selectedCycle,
    selectedYear,
    selectedOwnerType,
    fetchObjectives,
    fetchAlignment,
    fetchSummary,
  ]);

  const _canCreateCompanyObjective = user.role === 'ADMIN';
  const _canCreateTeamObjective = user.role === 'ADMIN' || user.role === 'MANAGER';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Loading OKRs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">OKRs</h1>
          <p className="text-muted-foreground">
            Objectives and Key Results for {selectedCycle} {selectedYear}
          </p>
        </div>

        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Objective
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalObjectives}</div>
              <p className="text-xs text-muted-foreground">{summary.activeObjectives} active</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(summary.averageProgress * 100)}%</div>
              <Progress value={summary.averageProgress * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Confidence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summary.averageConfidence * 100)}%
              </div>
              <Progress value={summary.averageConfidence * 100} className="mt-2 h-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Key Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.keyResultsByType.metric + summary.keyResultsByType.milestone}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.keyResultsByType.metric} metrics, {summary.keyResultsByType.milestone}{' '}
                milestones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select
          value={selectedCycle}
          onValueChange={(value) => setSelectedCycle(value as OkrCycle)}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={OkrCycle.ANNUAL}>Annual</SelectItem>
            <SelectItem value={OkrCycle.Q1}>Q1</SelectItem>
            <SelectItem value={OkrCycle.Q2}>Q2</SelectItem>
            <SelectItem value={OkrCycle.Q3}>Q3</SelectItem>
            <SelectItem value={OkrCycle.Q4}>Q4</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => setSelectedYear(parseInt(value))}
        >
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={selectedOwnerType}
          onValueChange={(value) => setSelectedOwnerType(value as ObjectiveOwner | 'all')}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value={ObjectiveOwner.COMPANY}>Company</SelectItem>
            <SelectItem value={ObjectiveOwner.TEAM}>Team</SelectItem>
            <SelectItem value={ObjectiveOwner.INDIVIDUAL}>Individual</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          <Tabs
            value={selectedView}
            onValueChange={(value) => setSelectedView(value as 'list' | 'alignment')}
          >
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="alignment">Alignment View</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Content */}
      {selectedView === 'list' ? (
        <div className="space-y-4">
          {objectives.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No objectives yet</h3>
                <p className="mb-4 text-muted-foreground">
                  Create your first objective to get started with OKRs
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Objective
                </Button>
              </CardContent>
            </Card>
          ) : (
            objectives.map((objective) => (
              <ObjectiveCard
                key={objective.id}
                objective={objective}
                onUpdate={() => {
                  fetchObjectives();
                  fetchSummary();
                }}
              />
            ))
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Company Objectives */}
          {alignment?.companyObjectives && alignment.companyObjectives.length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Company Objectives</h2>
              </div>
              {alignment.companyObjectives.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  onUpdate={() => {
                    fetchAlignment();
                    fetchSummary();
                  }}
                />
              ))}
            </div>
          )}

          {/* Team Objectives */}
          {alignment?.teamObjectives && Object.keys(alignment.teamObjectives).length > 0 && (
            <div>
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Team Objectives</h2>
              </div>
              {Object.entries(alignment.teamObjectives).map(([teamId, objectives]) => (
                <div key={teamId} className="mb-4 ml-6">
                  <h3 className="mb-2 font-medium">{objectives[0]?.ownerTeam?.name || 'Team'}</h3>
                  {objectives.map((objective) => (
                    <ObjectiveCard
                      key={objective.id}
                      objective={objective}
                      showActions={false}
                      onUpdate={() => {
                        fetchAlignment();
                        fetchSummary();
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Individual Objectives */}
          {alignment?.individualObjectives &&
            Object.keys(alignment.individualObjectives).length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Individual Objectives</h2>
                </div>
                {Object.entries(alignment.individualObjectives).map(([userId, objectives]) => (
                  <div key={userId} className="mb-4 ml-6">
                    <h3 className="mb-2 font-medium">
                      {objectives[0]?.ownerUser?.name || 'Individual'}
                    </h3>
                    {objectives.map((objective) => (
                      <ObjectiveCard
                        key={objective.id}
                        objective={objective}
                        showActions={userId === user.id}
                        onUpdate={() => {
                          fetchAlignment();
                          fetchSummary();
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
        </div>
      )}

      {showCreateDialog && (
        <CreateObjectiveDialog
          organizationId={organization.id}
          onClose={() => setShowCreateDialog(false)}
          onSuccess={() => {
            setShowCreateDialog(false);
            fetchObjectives();
            fetchAlignment();
            fetchSummary();
          }}
        />
      )}
    </div>
  );
}
