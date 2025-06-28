'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TemplateForm } from './template-form';

interface Question {
  id: string;
  type: 'text' | 'textarea' | 'rating' | 'select';
  text: string;
  required: boolean;
  options?: string[];
}

interface CheckInTemplate {
  id: string;
  name: string;
  description?: string;
  frequency: string;
  questions: Question[];
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function CheckInTemplateManager() {
  const [templates, setTemplates] = useState<CheckInTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<CheckInTemplate | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/checkin-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      // Error fetching templates
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setShowForm(true);
  };

  const handleEdit = (template: CheckInTemplate) => {
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('このテンプレートを削除しますか？')) return;

    try {
      const response = await fetch(`/api/checkin-templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchTemplates();
      } else {
        const error = await response.json();
        alert(error.error || '削除に失敗しました');
      }
    } catch (error) {
      // Error deleting template
      alert('削除に失敗しました');
    }
  };

  const handleFormSubmit = async () => {
    setShowForm(false);
    setEditingTemplate(null);
    await fetchTemplates();
  };

  const getFrequencyLabel = (frequency: string) => {
    const labels: Record<string, string> = {
      DAILY: '毎日',
      WEEKLY: '毎週',
      BIWEEKLY: '隔週',
      MONTHLY: '毎月',
      QUARTERLY: '四半期',
      CUSTOM: 'カスタム',
    };
    return labels[frequency] || frequency;
  };

  if (isLoading) {
    return <div className="py-8 text-center">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">テンプレート一覧</h2>
          <p className="mt-1 text-gray-600">{templates.length}個のテンプレートが設定されています</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          新しいテンプレート
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  {template.description && (
                    <CardDescription>{template.description}</CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  {template.isDefault && (
                    <Badge variant="default" className="text-xs">
                      デフォルト
                    </Badge>
                  )}
                  {!template.isActive && (
                    <Badge variant="outline" className="text-xs">
                      無効
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">頻度:</span>
                  <Badge variant="outline">{getFrequencyLabel(template.frequency)}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">質問数:</span>
                  <span className="font-medium">{template.questions.length}問</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">質問プレビュー</h4>
                <div className="space-y-1">
                  {template.questions.slice(0, 2).map((question, index) => (
                    <div key={index} className="truncate text-xs text-gray-600">
                      {index + 1}. {question.text}
                    </div>
                  ))}
                  {template.questions.length > 2 && (
                    <div className="text-xs text-gray-500">
                      ...他{template.questions.length - 2}問
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(template)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  編集
                </Button>
                {!template.isDefault && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(template.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {templates.length === 0 && (
        <Card className="py-12 text-center">
          <CardContent>
            <Settings className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 text-lg font-medium text-gray-900">テンプレートがありません</h3>
            <p className="mb-4 text-gray-600">最初のチェックインテンプレートを作成しましょう</p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              テンプレートを作成
            </Button>
          </CardContent>
        </Card>
      )}

      {showForm && (
        <TemplateForm
          template={editingTemplate}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingTemplate(null);
          }}
        />
      )}
    </div>
  );
}
