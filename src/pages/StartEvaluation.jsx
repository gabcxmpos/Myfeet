import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.jsx';
import { Slider } from '@/components/ui/slider.jsx';
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { CheckCircle, Users, Sparkles, Smartphone, ChevronLeft, ChevronRight, Store, FileText, AlertCircle, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isToday, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const pillarIcons = {
  Pessoas: { icon: Users, color: 'text-blue-400' },
  Ambientação: { icon: Sparkles, color: 'text-orange-400' },
  Digital: { icon: Smartphone, color: 'text-purple-400' },
};

const EvaluationScreen = ({ form, storeId, onComplete }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState(() => {
        const initialAnswers = {};
        form.questions.forEach(q => {
            if (q.type === 'satisfaction') initialAnswers[q.id] = 5;
            else if (q.type === 'checkbox') initialAnswers[q.id] = [];
            else initialAnswers[q.id] = '';
        });
        return initialAnswers;
    });
    const { addEvaluation } = useData();
    const { user } = useAuth();
    const { toast } = useToast();
    
    const handleAnswerChange = (questionId, value, type) => {
        if (type === 'satisfaction') {
            setAnswers(prev => ({ ...prev, [questionId]: value[0] }));
        } else if (type === 'checkbox') {
             setAnswers(prev => {
                const current = prev[questionId] || [];
                const updated = current.includes(value) ? current.filter(item => item !== value) : [...current, value];
                return { ...prev, [questionId]: updated };
            });
        }
        else {
             setAnswers(prev => ({ ...prev, [questionId]: value }));
        }
    };

    const handleNext = () => currentQuestion < form.questions.length - 1 && setCurrentQuestion(currentQuestion + 1);
    const handlePrevious = () => currentQuestion > 0 && setCurrentQuestion(currentQuestion - 1);

    const handleSubmit = () => {
        // Validar se todas as questões obrigatórias foram respondidas
        const unansweredQuestions = form.questions.filter(q => {
            if (q.type === 'text') return false; // Text não é obrigatório para score
            const answer = answers[q.id];
            if (q.type === 'satisfaction') return answer === undefined || answer === null;
            if (q.type === 'multiple-choice') return !answer || answer === '';
            if (q.type === 'checkbox') return !Array.isArray(answer) || answer.length === 0;
            return false;
        });

        if (unansweredQuestions.length > 0) {
            toast({
                variant: 'destructive',
                title: 'Avaliação incompleta',
                description: `Por favor, responda todas as questões antes de finalizar. ${unansweredQuestions.length} questão(ões) não respondida(s).`,
            });
            return;
        }

        let totalScore = 0;
        let maxScore = 0;

        form.questions.forEach(q => {
            const answer = answers[q.id];
            if (q.type === 'satisfaction') {
                const scoreValue = answer || 0;
                totalScore += scoreValue;
                maxScore += 10;
            } else if (q.type === 'multiple-choice') {
                const selectedOption = q.options.find(opt => opt.text === answer);
                const scoreValue = selectedOption ? selectedOption.value : 0;
                totalScore += scoreValue;
                // Para multiple-choice, o maxScore é o maior valor possível entre as opções
                maxScore += Math.max(...q.options.map(o => o.value || 0), 0);
            } else if (q.type === 'checkbox') {
                if(Array.isArray(answer) && answer.length > 0) {
                    answer.forEach(ans => {
                        const selectedOption = q.options.find(opt => opt.text === ans);
                        if (selectedOption) {
                            totalScore += selectedOption.value || 0;
                        }
                    });
                }
                // Para checkbox, maxScore é a soma de todos os valores positivos (assumindo que não se pode selecionar tudo)
                // Se todas as opções podem ser selecionadas, soma todos os valores positivos
                maxScore += q.options.reduce((sum, opt) => sum + Math.max(opt.value || 0, 0), 0);
            }
            // Questões do tipo 'text' não contribuem para o score
        });

        // Calcular score final e validar range
        let finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;
        
        // Validar range (0-100)
        if (finalScore < 0) {
            console.warn('⚠️ Score calculado abaixo de 0, ajustando para 0');
            finalScore = 0;
        } else if (finalScore > 100) {
            console.warn('⚠️ Score calculado acima de 100, ajustando para 100');
            finalScore = 100;
        }

        addEvaluation({
            storeId,
            formId: form.id,
            score: finalScore,
            answers,
            pillar: form.pillar,
            status: (user.role === 'loja' || user.role === 'admin_loja') ? 'pending' : 'approved',
        });

        toast({
            title: "Avaliação concluída!",
            description: `Pontuação: ${finalScore}. ${(user.role === 'loja' || user.role === 'admin_loja') ? 'Enviada para aprovação.' : ''}`,
        });
        onComplete();
    };

    const progress = ((currentQuestion + 1) / form.questions.length) * 100;
    const question = form.questions[currentQuestion];
    const currentAnswer = answers[question.id];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 sm:p-6 lg:p-8 mt-6">
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-primary">{form.title}</span>
                    <span className="text-sm font-medium text-foreground">{currentQuestion + 1} / {form.questions.length}</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${progress}%` }} /></div>
            </div>

            <AnimatePresence mode="wait">
                <motion.div key={currentQuestion} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-2">
                    <Label className="text-lg font-semibold text-foreground">{question.text}</Label>
                    <p className="text-sm text-muted-foreground pb-4">{question.subtitle}</p>
                    
                    <div className="pt-4">
                        {question.type === 'satisfaction' && (
                            <div className="space-y-4">
                                <Slider value={[currentAnswer]} onValueChange={(val) => handleAnswerChange(question.id, val, 'satisfaction')} max={10} min={0} step={1} />
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>0 - Ruim</span>
                                    <span className="text-2xl font-bold text-primary">{currentAnswer}</span>
                                    <span>10 - Excelente</span>
                                </div>
                            </div>
                        )}
                        {question.type === 'text' && (
                           <Textarea value={currentAnswer} onChange={(e) => handleAnswerChange(question.id, e.target.value, 'text')} placeholder="Sua resposta..." className="bg-secondary" />
                        )}
                         {question.type === 'multiple-choice' && (
                            <RadioGroup value={currentAnswer} onValueChange={(val) => handleAnswerChange(question.id, val, 'multiple-choice')} className="space-y-2">
                                {question.options.map(option => (
                                    <div key={option.text} className="flex items-center space-x-2">
                                        <RadioGroupItem value={option.text} id={`${question.id}-${option.text}`} />
                                        <Label htmlFor={`${question.id}-${option.text}`}>{option.text}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        )}
                         {question.type === 'checkbox' && (
                            <div className="space-y-2">
                            {question.options.map(option => (
                                <div key={option.text} className="flex items-center space-x-2">
                                    <Checkbox id={`${question.id}-${option.text}`} checked={(currentAnswer || []).includes(option.text)} onCheckedChange={() => handleAnswerChange(question.id, option.text, 'checkbox')} />
                                    <Label htmlFor={`${question.id}-${option.text}`}>{option.text}</Label>
                                </div>
                            ))}
                            </div>
                        )}
                    </div>
                </motion.div>
            </AnimatePresence>

            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
                <Button variant="outline" onClick={handlePrevious} disabled={currentQuestion === 0}><ChevronLeft className="w-4 h-4 mr-2" /> Anterior</Button>
                {currentQuestion === form.questions.length - 1 ? (
                    <Button onClick={handleSubmit} className="bg-green-500 hover:bg-green-600 text-white"><CheckCircle className="w-4 h-4 mr-2" /> Finalizar</Button>
                ) : (
                    <Button onClick={handleNext}><ChevronRight className="w-4 h-4 ml-2" /> Próxima</Button>
                )}
            </div>
        </motion.div>
    )
}

const StartEvaluation = () => {
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedFormId, setSelectedFormId] = useState('');
  const { stores, forms, evaluations } = useData();
  const { user } = useAuth();
  
  const availableStores = useMemo(() => {
      if (user.role === 'admin' || user.role === 'supervisor' || user.role === 'comunicação' || user.role === 'digital') return stores;
      if (user.role === 'loja') return stores.filter(s => s.id === user.storeId);
      return [];
  }, [stores, user]);

  const selectedForm = useMemo(() => forms.find(f => f.id === selectedFormId), [forms, selectedFormId]);

  // Buscar última avaliação de cada pilar para a loja selecionada
  const lastEvaluationsByPillar = useMemo(() => {
    if (!selectedStoreId || !evaluations || evaluations.length === 0) return {};
    
    const storeEvaluations = evaluations.filter(evaluation => evaluation.storeId === selectedStoreId || evaluation.store_id === selectedStoreId);
    const lastByPillar = {};
    
    storeEvaluations.forEach(evaluation => {
      const pillar = evaluation.pillar;
      const evaluationDate = evaluation.created_at || evaluation.createdAt || evaluation.date;
      
      if (!evaluationDate) return;
      
      if (!lastByPillar[pillar] || new Date(evaluationDate) > new Date(lastByPillar[pillar].date)) {
        lastByPillar[pillar] = {
          date: evaluationDate,
          score: evaluation.score,
          status: evaluation.status
        };
      }
    });
    
    return lastByPillar;
  }, [selectedStoreId, evaluations]);

  // Verificar se já existe avaliação no mesmo dia para um pilar
  const hasEvaluationToday = (pillar) => {
    const lastEvaluation = lastEvaluationsByPillar[pillar];
    if (!lastEvaluation) return false;
    
    try {
      const evaluationDate = parseISO(lastEvaluation.date);
      return isToday(evaluationDate);
    } catch {
      return false;
    }
  };
  
  const resetEvaluation = () => {
      setSelectedFormId('');
      if (user.role !== 'loja') {
          setSelectedStoreId(null);
      }
  }

  // Auto-select store if user is 'loja'
  useState(() => {
      if (user.role === 'loja' && availableStores.length > 0) {
          setSelectedStoreId(availableStores[0].id);
      }
  }, [user, availableStores]);


  if (selectedStoreId && selectedForm) {
      return <EvaluationScreen form={selectedForm} storeId={selectedStoreId} onComplete={resetEvaluation} />
  }

  return (
    <>
      <Helmet>
        <title>Nova Avaliação PPAD - MYFEET</title>
        <meta name="description" content="Selecione a loja e o formulário para iniciar a avaliação." />
      </Helmet>

      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Nova Avaliação</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Selecione a loja e o formulário para começar</p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl shadow-lg border border-border/50 p-4 sm:p-6"
        >
          {/* Seleção de Loja */}
          {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'comunicação' || user.role === 'digital') ? (
            <div className="space-y-2 mb-6">
              <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                <Store className="w-4 h-4 text-primary" />
                Selecione a Loja
              </Label>
              <Select onValueChange={setSelectedStoreId} value={selectedStoreId || ''}>
                <SelectTrigger className="h-11 bg-secondary/50">
                  <SelectValue placeholder="Escolha uma loja para avaliar..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {availableStores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{store.name}</span>
                        {store.code && (
                          <span className="text-xs text-muted-foreground">({store.code})</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            user.role === 'loja' && selectedStoreId && (
              <div className="space-y-2 mb-6">
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <Store className="w-4 h-4 text-primary" />
                  Loja
                </Label>
                <div className="h-11 px-4 bg-secondary/50 rounded-md flex items-center border border-border/50">
                  <span className="font-medium text-foreground">{availableStores[0]?.name}</span>
                </div>
              </div>
            )
          )}

          {/* Seleção de Formulário - Apenas Botões */}
          <AnimatePresence>
            {selectedStoreId && forms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <Label className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Selecione o Formulário
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {forms.map(form => {
                    const Icon = pillarIcons[form.pillar]?.icon || FileText;
                    const color = pillarIcons[form.pillar]?.color || 'text-foreground';
                    const isSelected = selectedFormId === form.id;
                    const lastEvaluation = lastEvaluationsByPillar[form.pillar];
                    const hasToday = hasEvaluationToday(form.pillar);
                    
                    let lastEvalText = '';
                    if (lastEvaluation) {
                      try {
                        const evaluationDate = parseISO(lastEvaluation.date);
                        if (isToday(evaluationDate)) {
                          lastEvalText = 'Hoje';
                        } else {
                          lastEvalText = format(evaluationDate, "dd/MM/yyyy", { locale: ptBR });
                        }
                      } catch {
                        lastEvalText = 'Data inválida';
                      }
                    }
                    
                    return (
                      <motion.button
                        key={form.id}
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedFormId(form.id)}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all text-left
                          ${hasToday ? 'border-yellow-500/50 bg-yellow-500/5' : ''}
                          ${isSelected 
                            ? 'bg-primary/10 border-primary shadow-lg shadow-primary/20' 
                            : 'bg-secondary/30 border-border/50 hover:border-primary/50 hover:bg-secondary/50'
                          }
                        `}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2.5 rounded-lg flex-shrink-0 ${isSelected ? 'bg-primary/20' : 'bg-secondary/50'}`}>
                            <Icon className={`w-5 h-5 ${color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <p className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {form.title}
                              </p>
                              {hasToday && (
                                <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{form.pillar}</p>
                            {lastEvaluation && (
                              <div className="flex items-center gap-1.5 mt-2 text-xs">
                                <Clock className="w-3 h-3 text-muted-foreground" />
                                <span className={`${hasToday ? 'text-yellow-500 font-semibold' : 'text-muted-foreground'}`}>
                                  Última: {lastEvalText}
                                  {lastEvaluation.score !== undefined && ` (${lastEvaluation.score} pts)`}
                                </span>
                              </div>
                            )}
                            {hasToday && (
                              <p className="text-xs text-yellow-500 font-medium mt-1">
                                ⚠️ Já avaliado hoje
                              </p>
                            )}
                          </div>
                          {isSelected && (
                            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mensagem quando nenhuma loja selecionada */}
          {!selectedStoreId && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'comunicação' || user.role === 'digital') && (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">Selecione uma loja para continuar</p>
            </div>
          )}
        </motion.div>
      </div>
    </>
  );
};

export default StartEvaluation;