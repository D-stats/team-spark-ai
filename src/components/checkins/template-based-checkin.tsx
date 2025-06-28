'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CheckCircle2, Clock } from 'lucide-react';

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

interface TemplateBasedCheckInProps {
  onSubmit?: () => void;
}

export function TemplateBasedCheckIn({ onSubmit }: TemplateBasedCheckInProps) {
  const [templates, setTemplates] = useState<CheckInTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<CheckInTemplate | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [moodRating, setMoodRating] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTemplates = useCallback(async () => {
    try {
      const response = await fetch('/api/checkin-templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);

        // Auto-select default template
        const defaultTemplate = data.find((t: CheckInTemplate) => t.isDefault);
        if (defaultTemplate) {
          setSelectedTemplate(defaultTemplate);
          initializeAnswers(defaultTemplate);
        }
      }
    } catch (error) {
      // Error fetching templates
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchTemplates();
  }, [fetchTemplates]);

  const initializeAnswers = (template: CheckInTemplate) => {
    const initialAnswers: Record<string, unknown> = {};
    template.questions.forEach((question) => {
      if (question.type === 'rating') {
        initialAnswers[question.id] = 3;
      } else {
        initialAnswers[question.id] = '';
      }
    });
    setAnswers(initialAnswers);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      initializeAnswers(template);
    }
  };

  const handleAnswerChange = (questionId: string, value: unknown) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateAnswers = () => {
    if (!selectedTemplate) return false;

    for (const question of selectedTemplate.questions) {
      if (question.required && !answers[question.id]) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplate || !validateAnswers()) {
      alert('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/checkins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          answers,
          moodRating,
        }),
      });

      if (response.ok) {
        alert('チェックインを完了しました！');
        // フォームをリセット
        initializeAnswers(selectedTemplate);
        setMoodRating(3);
        onSubmit?.();
      } else {
        const error = await response.json();
        alert(error.error || 'チェックインに失敗しました');
      }
    } catch (error) {
      // Error submitting check-in
      alert('チェックインに失敗しました');
    } finally {
      setIsSubmitting(false);
    }
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

  const renderQuestion = (question: Question) => {
    const value = answers[question.id] || '';

    switch (question.type) {
      case 'text':
        return (
          <Input
            value={String(value)}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="回答を入力してください"
            required={question.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={String(value)}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="回答を入力してください"
            rows={3}
            required={question.required}
          />
        );

      case 'rating':
        return (
          <RadioGroup
            value={String(value || 3)}
            onValueChange={(val) => handleAnswerChange(question.id, parseInt(val))}
            className="flex space-x-4"
          >
            {[1, 2, 3, 4, 5].map((rating) => (
              <div key={rating} className="flex items-center space-x-2">
                <RadioGroupItem value={rating.toString()} id={`${question.id}-${rating}`} />
                <Label htmlFor={`${question.id}-${rating}`}>{rating}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'select':
        return (
          <Select
            value={String(value)}
            onValueChange={(val) => handleAnswerChange(question.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder="選択してください" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Clock className="mr-2 h-4 w-4 animate-spin" />
          読み込み中...
        </CardContent>
      </Card>
    );
  }

  if (templates.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-gray-600">利用可能なテンプレートがありません</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          カスタムチェックイン
        </CardTitle>
        <CardDescription>テンプレートを選択してチェックインを作成してください</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* テンプレート選択 */}
          <div className="space-y-2">
            <Label htmlFor="template">テンプレート選択</Label>
            <Select value={selectedTemplate?.id || ''} onValueChange={handleTemplateChange}>
              <SelectTrigger>
                <SelectValue placeholder="テンプレートを選択" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    <div className="flex w-full items-center justify-between">
                      <span>{template.name}</span>
                      <span className="ml-2 text-xs text-gray-500">
                        {getFrequencyLabel(template.frequency)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate?.description && (
              <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
            )}
          </div>

          {/* 質問セクション */}
          {selectedTemplate && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">質問</h3>

              {selectedTemplate.questions.map((question, index) => (
                <div key={question.id} className="space-y-2">
                  <Label htmlFor={question.id} className="flex items-center gap-1">
                    {index + 1}. {question.text}
                    {question.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderQuestion(question)}
                </div>
              ))}

              {/* 気分評価 */}
              <div className="space-y-2">
                <Label>今日の気分 (1-5)</Label>
                <RadioGroup
                  value={moodRating.toString()}
                  onValueChange={(val) => setMoodRating(parseInt(val))}
                  className="flex space-x-4"
                >
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <div key={rating} className="flex items-center space-x-2">
                      <RadioGroupItem value={rating.toString()} id={`mood-${rating}`} />
                      <Label htmlFor={`mood-${rating}`}>{rating}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              disabled={!selectedTemplate || isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? '送信中...' : 'チェックイン完了'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
