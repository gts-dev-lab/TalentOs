
'use client';

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import * as db from '@/lib/db';
import type { User, PredictAbandonmentOutput } from '@/lib/types';
import { predictAbandonment } from '@/ai/flows/predict-abandonment';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, BrainCircuit, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function AbandonmentPrediction({ user }: { user: User }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [prediction, setPrediction] = useState<PredictAbandonmentOutput | null>(null);

    const handlePredict = async () => {
        if (isLoading) return;
        
        setIsLoading(true);
        setPrediction(null);

        try {
            // NOTE: In a real app, this data would come from a comprehensive analytics service.
            // For this demo, we simulate it to showcase the AI flow.
            const simulatedData = {
                userName: user.name,
                lastLogin: "hace 2 semanas", // Simulated
                activeCoursesCount: (user.name.length % 3) + 1, // Simulated
                completedCoursesCount: (user.name.length % 5), // Simulated
                averageProgress: (user.email.length * 2) % 100, // Simulated
            };

            const result = await predictAbandonment(simulatedData);
            setPrediction(result);

        } catch (error: any) {
            console.error("Failed to get prediction", error);
            const description = error.message?.includes('API no está configurada')
                ? error.message
                : "No se pudo obtener la predicción.";
            toast({
                title: "Error de IA",
                description,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" onClick={handlePredict} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BrainCircuit className="h-4 w-4" />}
                    <span className="ml-2 hidden sm:inline">Analizar</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
                {isLoading ? (
                    <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                ) : prediction ? (
                    <div className="grid gap-4">
                        <div className="space-y-2">
                            <h4 className="font-medium leading-none flex items-center gap-2">
                                <Bot /> Predicción de Riesgo
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                Análisis para <span className="font-semibold">{user.name}</span>.
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Nivel de Riesgo:</span>
                                <Badge variant={prediction.riskLevel === 'Alto' ? 'destructive' : prediction.riskLevel === 'Medio' ? 'secondary' : 'default'}>
                                    {prediction.riskLevel}
                                </Badge>
                            </div>
                                <div className="text-sm">
                                <p className="font-medium">Justificación:</p>
                                <p className="text-muted-foreground">{prediction.justification}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-sm text-muted-foreground p-4">Haz clic en &quot;Analizar&quot; para obtener una predicción de la IA.</p>
                )}
            </PopoverContent>
        </Popover>
    );
}

