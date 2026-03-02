// @ts-nocheck

'use client';

import { useState } from 'react';
import { Sparkles, Loader2, CheckCircle2, XCircle, Bot } from 'lucide-react';
import {
  GenerateTestQuestionsOutput,
  generateTestQuestions,
} from '@/ai/flows/generate-test-questions';
import { personalizedFeedback } from '@/ai/flows/feedback-personalization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AIConfig, User } from '@/lib/types';
import * as db from '@/lib/db';
import { useAuth } from '@/contexts/auth';
import { useToast } from '@/hooks/use-toast';

export function TestGenerator({
  courseTitle,
  courseContent,
  studentName,
  aiConfig,
}: {
  courseTitle: string;
  courseContent: string;
  studentName: string;
  aiConfig: AIConfig | undefined;
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testData, setTestData] = useState<GenerateTestQuestionsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedback, setFeedback] = useState('');

  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(null);

  const handleGenerateTest = async () => {
    setLoading(true);
    setError(null);
    setTestData(null);
    setFeedback('');
    // Reset test state
    setIsSubmitted(false);
    setScore(null);
    setAnswers({});
    try {
      const result = await generateTestQuestions({
        courseContent,
        numberOfQuestions: 3,
        difficulty: 'medium',
      });
      setTestData(result);
    } catch (e: any) {
      const errorMessage = e.message?.includes('API no está configurada')
        ? e.message
        : 'No se pudo generar el test. Inténtelo de nuevo.';
      setError(errorMessage);
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (qIndex: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qIndex]: value }));
  };

  const handleSubmitTest = async () => {
    if (!testData || !user) return;

    const correctCount = testData.questions.reduce((acc: number, question: any, index: number) => {
      return answers[index] === question.correctAnswer ? acc + 1 : acc;
    }, 0);

    const finalScore = (correctCount / testData.questions.length) * 100;
    setScore(finalScore);
    setIsSubmitted(true);

    if (finalScore === 100) {
      await db.awardBadge(user.id, 'perfect_score');
    }
  };

  const handleGetFeedback = async () => {
    if (!testData || score === null) return;
    setFeedbackLoading(true);
    setFeedback('');
    try {
      const questionsForFeedback = testData.questions.map((q: any, i: number) => ({
        question: q.question,
        studentAnswer: answers[i] || 'No contestada',
        correctAnswer: q.correctAnswer,
      }));

      const result = await personalizedFeedback({
        studentName: studentName,
        assignmentName: `Test de ${courseTitle}`,
        score: score,
        questions: questionsForFeedback,
      });
      setFeedback(result.feedback);
    } catch (e: any) {
      toast({
        title: 'Error de IA',
        description: e.message?.includes('API no está configurada')
          ? e.message
          : 'No se pudo obtener el feedback.',
        variant: 'destructive',
      });
      console.error(e);
    } finally {
      setFeedbackLoading(false);
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Test de Autoevaluación</CardTitle>
        <CardDescription>Genera un test con IA para comprobar tus conocimientos.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!testData && !loading && (
          <div className="flex justify-center">
            <Button onClick={handleGenerateTest} disabled={loading} size="lg">
              <Sparkles className="mr-2 h-4 w-4" />
              Generar Test
            </Button>
          </div>
        )}
        {loading && (
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
        {error && <p className="text-center text-destructive">{error}</p>}
        {testData && (
          <div className="space-y-6">
            {isSubmitted && score !== null && (
              <Card className="bg-muted/50 text-center">
                <CardHeader>
                  <CardTitle>Resultado: {score.toFixed(0)}%</CardTitle>
                </CardHeader>
              </Card>
            )}
            {testData.questions.map((q, i) => {
              const isCorrect = answers[i] === q.correctAnswer;
              return (
                <div key={i}>
                  <div className="flex items-start gap-2 font-semibold mb-2">
                    {isSubmitted &&
                      (isCorrect ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      ))}
                    <p>
                      {i + 1}. {q.question}
                    </p>
                  </div>
                  <RadioGroup
                    onValueChange={value => handleAnswerChange(i, value)}
                    disabled={isSubmitted}
                    value={answers[i]}
                  >
                    {q.options.map((opt: string, j: number) => {
                      const isSelected = answers[i] === opt;
                      const isTheCorrectAnswer = opt === q.correctAnswer;
                      return (
                        <div key={j} className="flex items-center space-x-2">
                          <RadioGroupItem value={opt} id={`q${i}o${j}`} />
                          <Label
                            htmlFor={`q${i}o${j}`}
                            className={cn(
                              isSubmitted && isTheCorrectAnswer && 'text-green-600 font-bold',
                              isSubmitted &&
                                isSelected &&
                                !isTheCorrectAnswer &&
                                'text-destructive line-through'
                            )}
                          >
                            {opt}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                  {isSubmitted && !isCorrect && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Respuesta correcta: <span className="font-semibold">{q.correctAnswer}</span>
                    </p>
                  )}
                </div>
              );
            })}

            {!isSubmitted ? (
              <Button
                onClick={handleSubmitTest}
                disabled={Object.keys(answers).length !== testData.questions.length}
              >
                Enviar Respuestas
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateTest} disabled={loading}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Intentar de Nuevo
                </Button>
                {aiConfig?.enabledFeatures.feedback && (
                  <Button variant="outline" onClick={handleGetFeedback} disabled={feedbackLoading}>
                    {feedbackLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Bot className="mr-2 h-4 w-4" />
                    )}
                    Obtener Feedback
                  </Button>
                )}
              </div>
            )}
            {feedback && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
                <h4 className="font-semibold text-primary flex items-center gap-2">
                  <Bot /> Feedback Personalizado
                </h4>
                <p className="text-sm text-blue-900">{feedback}</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
