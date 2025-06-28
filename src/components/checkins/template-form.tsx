'use client';

import { useState } from 'react';
import { X, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

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
}

interface TemplateFormProps {
  template?: CheckInTemplate | null;
  onSubmit: () => void;
  onCancel: () => void;
}

const frequencyOptions = [
  { value: 'DAILY', label: '毎日' },
  { value: 'WEEKLY', label: '毎週' },
  { value: 'BIWEEKLY', label: '隔週' },
  { value: 'MONTHLY', label: '毎月' },
  { value: 'QUARTERLY', label: '四半期' },
  { value: 'CUSTOM', label: 'カスタム' },
];

const questionTypes = [
  { value: 'text', label: 'テキスト（短文）' },
  { value: 'textarea', label: 'テキスト（長文）' },
  { value: 'rating', label: '評価（1-5）' },
  { value: 'select', label: '選択肢' },
];

export function TemplateForm({ template, onSubmit, onCancel }: TemplateFormProps) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    frequency: template?.frequency || 'WEEKLY',
    isDefault: template?.isDefault || false,
    isActive: template?.isActive ?? true,
  });

  const [questions, setQuestions] = useState<Question[]>(
    template?.questions || [
      {
        id: '1',
        type: 'textarea',
        text: '今週の主な成果は何でしたか？',
        required: true,
      },
      {
        id: '2',
        type: 'textarea',
        text: '来週の目標を教えてください',
        required: true,
      },
      {
        id: '3',
        type: 'rating',
        text: '今週のエネルギーレベル（1-5）',
        required: false,
      },
    ],
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: 'text',
      text: '',
      required: false,
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (id: string, updates: Partial<Question>) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, ...updates } : q)));
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = template ? `/api/checkin-templates/${template.id}` : '/api/checkin-templates';
      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          questions,
        }),
      });

      if (response.ok) {
        onSubmit();
      } else {
        const error = await response.json();
        alert(error.error || '保存に失敗しました');
      }
    } catch (error) {
      alert('保存に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white">
        <form onSubmit={handleSubmit}>
          <div className="sticky top-0 flex items-center justify-between border-b bg-white px-6 py-4">
            <h2 className="text-xl font-semibold">
              {template ? 'テンプレート編集' : '新しいテンプレート'}
            </h2>
            <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6 p-6">
            {/* 基本情報 */}
            <Card>
              <CardHeader>
                <CardTitle>基本情報</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">テンプレート名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="例: 週次チェックイン"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="このテンプレートの説明（任意）"
                    rows={2}
                  />
                </div>

                <div>
                  <Label htmlFor="frequency">チェックイン頻度</Label>
                  <Select
                    value={formData.frequency}
                    onValueChange={(value) => setFormData({ ...formData, frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isDefault"
                    checked={formData.isDefault}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isDefault: Boolean(checked) })
                    }
                  />
                  <Label htmlFor="isDefault">デフォルトテンプレートに設定</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, isActive: Boolean(checked) })
                    }
                  />
                  <Label htmlFor="isActive">有効</Label>
                </div>
              </CardContent>
            </Card>

            {/* 質問設定 */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>質問設定</CardTitle>
                <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                  <Plus className="mr-2 h-4 w-4" />
                  質問を追加
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium">質問 {index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <div className="md:col-span-2">
                        <Label>質問文</Label>
                        <Input
                          value={question.text}
                          onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                          placeholder="質問を入力してください"
                        />
                      </div>
                      <div>
                        <Label>回答タイプ</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) =>
                            updateQuestion(question.id, { type: value as Question['type'] })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {questionTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {question.type === 'select' && (
                      <div>
                        <Label>選択肢（カンマ区切り）</Label>
                        <Input
                          value={question.options?.join(', ') || ''}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              options: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          placeholder="選択肢1, 選択肢2, 選択肢3"
                        />
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`required-${question.id}`}
                        checked={question.required}
                        onCheckedChange={(checked) =>
                          updateQuestion(question.id, { required: Boolean(checked) })
                        }
                      />
                      <Label htmlFor={`required-${question.id}`}>必須回答</Label>
                    </div>
                  </div>
                ))}

                {questions.length === 0 && (
                  <div className="py-8 text-center text-gray-500">
                    質問がありません。「質問を追加」ボタンをクリックして質問を作成してください。
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="sticky bottom-0 flex justify-end gap-3 border-t bg-white px-6 py-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
