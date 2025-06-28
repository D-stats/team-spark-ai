'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Users, Calendar, TrendingUp, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

interface EvaluationCycle {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  phases: EvaluationPhase[];
  _count: {
    evaluations: number;
  };
}

interface EvaluationPhase {
  id: string;
  type: string;
  name: string;
  startDate: string;
  endDate: string;
  order: number;
  isActive: boolean;
}

interface Evaluation {
  id: string;
  type: string;
  status: string;
  overallRating?: number;
  submittedAt?: string;
  cycle: {
    id: string;
    name: string;
    type: string;
  };
  evaluatee: {
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  evaluator: {
    id: string;
    name: string;
    email: string;
  };
}

// Status labels will be translated dynamically

export default function EvaluationsPage(): JSX.Element {
  const [cycles, setCycles] = useState<EvaluationCycle[]>([]);
  const [myEvaluations, setMyEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const t = useTranslations('evaluations');
  const locale = useLocale();

  const statusLabels = {
    DRAFT: t('cycleStatus.draft'),
    ACTIVE: t('cycleStatus.active'),
    COMPLETED: t('cycleStatus.completed'),
    ARCHIVED: t('cycleStatus.archived'),
  };

  const evaluationTypeLabels = {
    SELF: t('evaluationType.self'),
    PEER: t('evaluationType.peer'),
    MANAGER: t('evaluationType.manager'),
    SKIP_LEVEL: t('evaluationType.skip_level'),
    UPWARD: t('evaluationType.upward'),
  };

  const evaluationStatusLabels = {
    DRAFT: t('evaluationStatus.draft'),
    SUBMITTED: t('evaluationStatus.submitted'),
    REVIEWED: t('evaluationStatus.reviewed'),
    APPROVED: t('evaluationStatus.approved'),
    SHARED: t('evaluationStatus.shared'),
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // サイクル一覧を取得
      const cyclesResponse = await fetch('/api/evaluations/cycles');
      if (cyclesResponse.ok) {
        const cyclesData = (await cyclesResponse.json()) as EvaluationCycle[];
        setCycles(cyclesData);
      }

      // 自分の評価一覧を取得
      const evaluationsResponse = await fetch('/api/evaluations');
      if (evaluationsResponse.ok) {
        const evaluationsData = (await evaluationsResponse.json()) as Evaluation[];
        setMyEvaluations(evaluationsData);
      }
    } catch (error) {
      // Keep console.error for client-side debugging until proper error tracking is implemented
      console.error('データ取得エラー:', error);
      // TODO: Add user-friendly error notification when toast system is implemented
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'COMPLETED':
        return 'secondary';
      case 'ARCHIVED':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getEvaluationStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'REVIEWED':
      case 'APPROVED':
      case 'SHARED':
        return 'default';
      case 'DRAFT':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const activeCycle = cycles.find((cycle) => cycle.status === 'ACTIVE');
  const pendingEvaluations = myEvaluations.filter((evaluation) => evaluation.status === 'DRAFT');

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[...(Array(3) as unknown[])].map((_, i) => (
              <div key={i} className="h-32 rounded bg-gray-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {t('createCycle')}
        </Button>
      </div>

      {/* 概要カード */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card data-testid="active-cycle-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.activeCycle')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeCycle ? activeCycle.name : t('stats.notStarted')}
            </div>
            <p className="text-xs text-muted-foreground">
              {activeCycle
                ? t('stats.evaluationsCount', { count: activeCycle._count.evaluations })
                : t('stats.noActiveCycle')}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="pending-evaluations-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.pendingEvaluations')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingEvaluations.length}</div>
            <p className="text-xs text-muted-foreground">{t('stats.yourEvaluations')}</p>
          </CardContent>
        </Card>

        <Card data-testid="total-cycles-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('stats.totalCycles')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cycles.length}</div>
            <p className="text-xs text-muted-foreground">{t('stats.completedCycles')}</p>
          </CardContent>
        </Card>
      </div>

      {/* タブ */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
          <TabsTrigger value="cycles">{t('tabs.cycles')}</TabsTrigger>
          <TabsTrigger value="my-evaluations">{t('tabs.myEvaluations')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* アクティブサイクルの詳細 */}
          {activeCycle && (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{activeCycle.name}</CardTitle>
                    <CardDescription>
                      {new Date(activeCycle.startDate).toLocaleDateString(
                        locale === 'ja' ? 'ja-JP' : 'en-US',
                      )}{' '}
                      -
                      {new Date(activeCycle.endDate).toLocaleDateString(
                        locale === 'ja' ? 'ja-JP' : 'en-US',
                      )}
                    </CardDescription>
                  </div>
                  <Badge variant={getStatusBadgeVariant(activeCycle.status)}>
                    {statusLabels[activeCycle.status as keyof typeof statusLabels]}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="font-medium">{t('phases.title')}</h4>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {activeCycle.phases.map((phase) => (
                      <div key={phase.id} className="rounded-lg border p-3">
                        <div className="text-sm font-medium">{phase.name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(phase.startDate).toLocaleDateString(
                            locale === 'ja' ? 'ja-JP' : 'en-US',
                          )}{' '}
                          -
                          {new Date(phase.endDate).toLocaleDateString(
                            locale === 'ja' ? 'ja-JP' : 'en-US',
                          )}
                        </div>
                        {phase.isActive && (
                          <Badge variant="default" className="mt-2 text-xs">
                            {t('phases.inProgress')}
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 未完了評価 */}
          {pendingEvaluations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('stats.pendingEvaluations')}</CardTitle>
                <CardDescription>
                  {t('stats.evaluationsCount', { count: pendingEvaluations.length })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingEvaluations.slice(0, 5).map((evaluation) => (
                    <div
                      key={evaluation.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">
                            {evaluation.evaluatee.name} -{' '}
                            {
                              evaluationTypeLabels[
                                evaluation.type as keyof typeof evaluationTypeLabels
                              ]
                            }
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {evaluation.cycle.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getEvaluationStatusBadgeVariant(evaluation.status)}>
                          {
                            evaluationStatusLabels[
                              evaluation.status as keyof typeof evaluationStatusLabels
                            ]
                          }
                        </Badge>
                        <Button size="sm">{t('actions.start')}</Button>
                      </div>
                    </div>
                  ))}
                  {pendingEvaluations.length > 5 && (
                    <div className="text-center">
                      <Button variant="outline" onClick={() => setActiveTab('my-evaluations')}>
                        {t('actions.showMore')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="cycles" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {cycles.map((cycle) => (
              <Card key={cycle.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{cycle.name}</CardTitle>
                      <CardDescription>
                        {new Date(cycle.startDate).toLocaleDateString(
                          locale === 'ja' ? 'ja-JP' : 'en-US',
                        )}{' '}
                        -
                        {new Date(cycle.endDate).toLocaleDateString(
                          locale === 'ja' ? 'ja-JP' : 'en-US',
                        )}
                      </CardDescription>
                    </div>
                    <Badge variant={getStatusBadgeVariant(cycle.status)}>
                      {statusLabels[cycle.status as keyof typeof statusLabels]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      {t('stats.evaluationsCount', { count: cycle._count.evaluations })} •{' '}
                      {cycle.type}
                    </div>
                    <Button variant="outline" size="sm">
                      {t('actions.viewDetails')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-evaluations" className="space-y-6">
          <div className="grid grid-cols-1 gap-4">
            {myEvaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">
                          {evaluation.evaluatee.name} -{' '}
                          {
                            evaluationTypeLabels[
                              evaluation.type as keyof typeof evaluationTypeLabels
                            ]
                          }
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {evaluation.cycle.name}
                          {evaluation.submittedAt !== undefined && (
                            <span>
                              {' '}
                              •{' '}
                              {formatDistanceToNow(new Date(evaluation.submittedAt), {
                                addSuffix: true,
                                locale: locale === 'ja' ? ja : undefined,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {evaluation.overallRating !== undefined && (
                        <div className="text-sm font-medium">{evaluation.overallRating}/5</div>
                      )}
                      <Badge variant={getEvaluationStatusBadgeVariant(evaluation.status)}>
                        {
                          evaluationStatusLabels[
                            evaluation.status as keyof typeof evaluationStatusLabels
                          ]
                        }
                      </Badge>
                      <Button
                        size="sm"
                        variant={evaluation.status === 'DRAFT' ? 'default' : 'outline'}
                      >
                        {evaluation.status === 'DRAFT'
                          ? t('actions.continue')
                          : t('actions.review')}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
