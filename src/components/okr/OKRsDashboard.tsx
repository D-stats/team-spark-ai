'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { Plus, Target, TrendingUp, Users, Building2, BarChart3 } from 'lucide-react'
import { ObjectiveOwner, OkrCycle, ObjectiveStatus, User, Organization } from '@prisma/client'
import { ObjectiveWithRelations, OkrAlignment, getCurrentQuarter } from '@/types/okr'
import { ObjectiveCard } from '@/components/okr/ObjectiveCard'
import { CreateObjectiveDialog } from '@/components/okr/CreateObjectiveDialog'
import { useToast } from '@/components/ui/use-toast'

interface OKRsDashboardProps {
  user: User & { organization: Organization }
  organization: Organization
}

export function OKRsDashboard({ user, organization }: OKRsDashboardProps) {
  const { toast } = useToast()
  
  const [objectives, setObjectives] = useState<ObjectiveWithRelations[]>([])
  const [alignment, setAlignment] = useState<OkrAlignment | null>(null)
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [selectedView, setSelectedView] = useState<'list' | 'alignment'>('list')
  
  const currentYear = new Date().getFullYear()
  const currentQuarter = getCurrentQuarter()
  
  const [selectedCycle, setSelectedCycle] = useState<OkrCycle>(currentQuarter)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [selectedOwnerType, setSelectedOwnerType] = useState<ObjectiveOwner | 'all'>('all')

  const fetchObjectives = async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString(),
        ...(selectedOwnerType !== 'all' && { ownerType: selectedOwnerType })
      })
      
      const response = await fetch(`/api/okr/objectives?${params}`)
      if (!response.ok) throw new Error('Failed to fetch objectives')
      
      const data = await response.json()
      setObjectives(data)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load objectives',
        variant: 'destructive'
      })
    }
  }

  const fetchAlignment = async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString()
      })
      
      const response = await fetch(`/api/okr/alignment?${params}`)
      if (!response.ok) throw new Error('Failed to fetch alignment')
      
      const data = await response.json()
      setAlignment(data)
    } catch (error) {
      console.error('Failed to fetch alignment:', error)
    }
  }

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        cycle: selectedCycle,
        year: selectedYear.toString()
      })
      
      const response = await fetch(`/api/okr/summary?${params}`)
      if (!response.ok) throw new Error('Failed to fetch summary')
      
      const data = await response.json()
      setSummary(data)
    } catch (error) {
      console.error('Failed to fetch summary:', error)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([
        fetchObjectives(),
        fetchAlignment(),
        fetchSummary()
      ])
      setLoading(false)
    }
    
    loadData()
  }, [selectedCycle, selectedYear, selectedOwnerType])

  const canCreateCompanyObjective = user.role === 'ADMIN'
  const canCreateTeamObjective = user.role === 'ADMIN' || user.role === 'MANAGER'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading OKRs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">OKRs</h1>
          <p className="text-muted-foreground">
            Objectives and Key Results for {selectedCycle} {selectedYear}
          </p>
        </div>
        
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Objective
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalObjectives}</div>
              <p className="text-xs text-muted-foreground">
                {summary.activeObjectives} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(summary.averageProgress * 100)}%
              </div>
              <Progress value={summary.averageProgress * 100} className="h-2 mt-2" />
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
              <Progress value={summary.averageConfidence * 100} className="h-2 mt-2" />
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
                {summary.keyResultsByType.metric} metrics, {summary.keyResultsByType.milestone} milestones
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={selectedCycle} onValueChange={(value) => setSelectedCycle(value as OkrCycle)}>
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

        <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2026">2026</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedOwnerType} onValueChange={(value) => setSelectedOwnerType(value as ObjectiveOwner | 'all')}>
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
          <Tabs value={selectedView} onValueChange={(value) => setSelectedView(value as 'list' | 'alignment')}>
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
              <CardContent className="text-center py-12">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No objectives yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first objective to get started with OKRs
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
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
                  fetchObjectives()
                  fetchSummary()
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
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Company Objectives</h2>
              </div>
              {alignment.companyObjectives.map((objective) => (
                <ObjectiveCard
                  key={objective.id}
                  objective={objective}
                  onUpdate={() => {
                    fetchAlignment()
                    fetchSummary()
                  }}
                />
              ))}
            </div>
          )}

          {/* Team Objectives */}
          {alignment?.teamObjectives && Object.keys(alignment.teamObjectives).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Users className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Team Objectives</h2>
              </div>
              {Object.entries(alignment.teamObjectives).map(([teamId, objectives]) => (
                <div key={teamId} className="ml-6 mb-4">
                  <h3 className="font-medium mb-2">{objectives[0]?.ownerTeam?.name || 'Team'}</h3>
                  {objectives.map((objective) => (
                    <ObjectiveCard
                      key={objective.id}
                      objective={objective}
                      showActions={false}
                      onUpdate={() => {
                        fetchAlignment()
                        fetchSummary()
                      }}
                    />
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Individual Objectives */}
          {alignment?.individualObjectives && Object.keys(alignment.individualObjectives).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Target className="h-5 w-5" />
                <h2 className="text-xl font-semibold">Individual Objectives</h2>
              </div>
              {Object.entries(alignment.individualObjectives).map(([userId, objectives]) => (
                <div key={userId} className="ml-6 mb-4">
                  <h3 className="font-medium mb-2">{objectives[0]?.ownerUser?.name || 'Individual'}</h3>
                  {objectives.map((objective) => (
                    <ObjectiveCard
                      key={objective.id}
                      objective={objective}
                      showActions={userId === user.id}
                      onUpdate={() => {
                        fetchAlignment()
                        fetchSummary()
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
            setShowCreateDialog(false)
            fetchObjectives()
            fetchAlignment()
            fetchSummary()
          }}
        />
      )}
    </div>
  )
}