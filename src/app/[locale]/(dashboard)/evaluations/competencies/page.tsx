'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Target, Users, Briefcase, Lightbulb } from 'lucide-react';
// Using console.log for toast functionality
const toast = {
  success: (_message: string) => {
    // TODO: Replace with proper toast implementation
  },
  error: (_message: string) => {
    // TODO: Replace with proper toast implementation
  },
};

interface Competency {
  id: string;
  name: string;
  description: string;
  category: string;
  behaviors: string[];
  order: number;
  isActive: boolean;
  _count: {
    ratings: number;
  };
}

const categoryLabels = {
  CORE: 'コアコンピテンシー',
  LEADERSHIP: 'リーダーシップ',
  TECHNICAL: '技術スキル',
  FUNCTIONAL: '職能別スキル',
};

const categoryIcons = {
  CORE: Target,
  LEADERSHIP: Users,
  TECHNICAL: Briefcase,
  FUNCTIONAL: Lightbulb,
};

export default function CompetenciesPage() {
  const [competencies, setCompetencies] = useState<Competency[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCompetency, setEditingCompetency] = useState<Competency | null>(null);
  const [filter, setFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // フォーム状態
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'CORE',
    behaviors: [''],
    order: 0,
  });

  useEffect(() => {
    loadCompetencies();
  }, []);

  const loadCompetencies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/competencies');
      if (response.ok) {
        const data = await response.json();
        setCompetencies(data);
      } else {
        toast.error('コンピテンシーの読み込みに失敗しました');
      }
    } catch (error) {
      // Keep console.error for client-side debugging until proper error tracking is implemented
      console.error('コンピテンシー読み込みエラー:', error);
      toast.error('コンピテンシーの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const initializeDefaultCompetencies = async () => {
    try {
      const response = await fetch('/api/competencies/init', {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message);
        loadCompetencies();
      } else {
        const error = await response.json();
        toast.error(error.error || 'デフォルトコンピテンシーの初期化に失敗しました');
      }
    } catch (error) {
      // Keep console.error for client-side debugging until proper error tracking is implemented
      console.error('デフォルトコンピテンシー初期化エラー:', error);
      toast.error('デフォルトコンピテンシーの初期化に失敗しました');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'CORE',
      behaviors: [''],
      order: 0,
    });
    setEditingCompetency(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (competency: Competency) => {
    setFormData({
      name: competency.name,
      description: competency.description,
      category: competency.category,
      behaviors: competency.behaviors.length > 0 ? competency.behaviors : [''],
      order: competency.order,
    });
    setEditingCompetency(competency);
    setIsCreateDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanedBehaviors = formData.behaviors.filter((b) => b.trim() !== '');

    try {
      const url = editingCompetency
        ? `/api/competencies/${editingCompetency.id}`
        : '/api/competencies';
      const method = editingCompetency ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          behaviors: cleanedBehaviors,
        }),
      });

      if (response.ok) {
        toast.success(
          editingCompetency ? 'コンピテンシーを更新しました' : 'コンピテンシーを作成しました',
        );
        setIsCreateDialogOpen(false);
        resetForm();
        loadCompetencies();
      } else {
        const error = await response.json();
        toast.error(error.error || 'コンピテンシーの保存に失敗しました');
      }
    } catch (error) {
      // Keep console.error for client-side debugging until proper error tracking is implemented
      console.error('コンピテンシー保存エラー:', error);
      toast.error('コンピテンシーの保存に失敗しました');
    }
  };

  const deleteCompetency = async (competency: Competency) => {
    try {
      const response = await fetch(`/api/competencies/${competency.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'コンピテンシーを削除しました');
        loadCompetencies();
      } else {
        const error = await response.json();
        toast.error(error.error || 'コンピテンシーの削除に失敗しました');
      }
    } catch (error) {
      // Keep console.error for client-side debugging until proper error tracking is implemented
      console.error('コンピテンシー削除エラー:', error);
      toast.error('コンピテンシーの削除に失敗しました');
    }
  };

  const addBehavior = () => {
    setFormData((prev) => ({
      ...prev,
      behaviors: [...prev.behaviors, ''],
    }));
  };

  const updateBehavior = (index: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      behaviors: prev.behaviors.map((b, i) => (i === index ? value : b)),
    }));
  };

  const removeBehavior = (index: number) => {
    if (formData.behaviors.length > 1) {
      setFormData((prev) => ({
        ...prev,
        behaviors: prev.behaviors.filter((_, i) => i !== index),
      }));
    }
  };

  const filteredCompetencies = competencies.filter((competency) => {
    const matchesSearch =
      competency.name.toLowerCase().includes(filter.toLowerCase()) ||
      competency.description.toLowerCase().includes(filter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || competency.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const groupedCompetencies = filteredCompetencies.reduce(
    (acc, competency) => {
      if (!acc[competency.category]) {
        acc[competency.category] = [];
      }
      acc[competency.category]!.push(competency);
      return acc;
    },
    {} as Record<string, Competency[]>,
  );

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 rounded bg-gray-200"></div>
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
          <h1 className="text-3xl font-bold">コンピテンシー管理</h1>
          <p className="mt-2 text-muted-foreground">評価に使用するコンピテンシーを管理します</p>
        </div>
        <div className="flex space-x-2">
          {competencies.length === 0 && (
            <Button variant="outline" onClick={initializeDefaultCompetencies}>
              デフォルトを初期化
            </Button>
          )}
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreateDialog}>
                <Plus className="mr-2 h-4 w-4" />
                コンピテンシー作成
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingCompetency ? 'コンピテンシー編集' : 'コンピテンシー作成'}
                  </DialogTitle>
                  <DialogDescription>
                    評価に使用するコンピテンシーを{editingCompetency ? '編集' : '作成'}します。
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">コンピテンシー名 *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="例: コミュニケーション"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">カテゴリ *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, category: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(categoryLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="description">説明 *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      placeholder="コンピテンシーの詳細説明"
                      required
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="order">表示順序</Label>
                    <Input
                      id="order"
                      type="number"
                      value={formData.order}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                      }
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <Label>期待される行動</Label>
                    <div className="mt-2 space-y-2">
                      {formData.behaviors.map((behavior, index) => (
                        <div key={index} className="flex space-x-2">
                          <Input
                            value={behavior}
                            onChange={(e) => updateBehavior(index, e.target.value)}
                            placeholder={`行動例 ${index + 1}`}
                          />
                          {formData.behaviors.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removeBehavior(index)}
                            >
                              削除
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={addBehavior}>
                        行動を追加
                      </Button>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    キャンセル
                  </Button>
                  <Button type="submit">{editingCompetency ? '更新' : '作成'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* フィルター */}
      <div className="flex space-x-4">
        <div className="flex-1">
          <Input
            placeholder="コンピテンシーを検索..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">すべてのカテゴリ</SelectItem>
            {Object.entries(categoryLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* コンピテンシー一覧 */}
      {competencies.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-medium">コンピテンシーがありません</h3>
            <p className="mt-2 text-muted-foreground">
              コンピテンシーを作成して評価システムを開始しましょう。
            </p>
            <div className="mt-4 flex justify-center space-x-2">
              <Button onClick={initializeDefaultCompetencies}>デフォルトを初期化</Button>
              <Button variant="outline" onClick={openCreateDialog}>
                カスタム作成
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedCompetencies).map(([category, competencies]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <div key={category}>
                <div className="mb-4 flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </h2>
                  <Badge variant="outline">{competencies.length}</Badge>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {competencies.map((competency) => (
                    <Card key={competency.id} className={!competency.isActive ? 'opacity-50' : ''}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{competency.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {competency.description}
                            </CardDescription>
                          </div>
                          <div className="ml-2 flex space-x-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(competency)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    コンピテンシーを削除しますか？
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    「{competency.name}」を削除します。この操作は元に戻せません。
                                    {competency._count.ratings > 0 && (
                                      <span className="text-orange-600">
                                        ※
                                        このコンピテンシーは評価データがあるため、非アクティブ化されます。
                                      </span>
                                    )}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => deleteCompetency(competency)}>
                                    削除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </CardHeader>
                      {competency.behaviors.length > 0 && (
                        <CardContent>
                          <div>
                            <h4 className="mb-2 text-sm font-medium">期待される行動:</h4>
                            <ul className="space-y-1 text-sm text-muted-foreground">
                              {competency.behaviors.map((behavior, index) => (
                                <li key={index} className="flex items-start">
                                  <span className="mr-2">•</span>
                                  <span>{behavior}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {competency._count.ratings > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <div className="text-sm text-muted-foreground">
                                {competency._count.ratings}件の評価で使用済み
                              </div>
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
