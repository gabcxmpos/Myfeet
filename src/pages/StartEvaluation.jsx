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
import { CheckCircle, Users, Sparkles, Smartphone, ChevronLeft, ChevronRight, Store, FileText } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
        let totalScore = 0;
        let maxScore = 0;

        form.questions.forEach(q => {
            const answer = answers[q.id];
            if (q.type === 'satisfaction') {
                totalScore += answer || 0;
                maxScore += 10;
            } else if (q.type === 'multiple-choice') {
                const selectedOption = q.options.find(opt => opt.text === answer);
                totalScore += selectedOption ? selectedOption.value : 0;
                maxScore += Math.max(...q.options.map(o => o.value));
            } else if (q.type === 'checkbox') {
                 if(Array.isArray(answer)) {
                     answer.forEach(ans => {
                         const selectedOption = q.options.find(opt => opt.text === ans);
                         totalScore += selectedOption ? selectedOption.value : 0;
                     });
                 }
                maxScore += q.options.reduce((sum, opt) => sum + (opt.value > 0 ? opt.value : 0), 0);
            }
        });

        const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 100;

        addEvaluation({
            storeId,
            formId: form.id,
            score: finalScore,
            answers,
            pillar: form.pillar,
            status: user.role === 'loja' ? 'pending' : 'approved',
        });

        toast({
            title: "Avaliação concluída!",
            description: `Pontuação: ${finalScore}. ${user.role === 'loja' ? 'Enviada para aprovação.' : ''}`,
        });
        onComplete();
    };

    const progress = ((currentQuestion + 1) / form.questions.length) * 100;
    const question = form.questions[currentQuestion];
    const currentAnswer = answers[question.id];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl shadow-lg border border-border p-8 mt-6">
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
  const { stores, forms } = useData();
  const { user } = useAuth();
  
  const availableStores = useMemo(() => {
      if (user.role === 'admin' || user.role === 'supervisor') return stores;
      if (user.role === 'loja') return stores.filter(s => s.id === user.storeId);
      return [];
  }, [stores, user]);

  const selectedForm = useMemo(() => forms.find(f => f.id === selectedFormId), [forms, selectedFormId]);
  
  const resetEvaluation = () => {
      setSelectedFormId('');
      if (user.role !== 'loja') {
          setSelectedStoreId('');
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

      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Iniciar Avaliação</h1>
          <p className="text-muted-foreground mt-1">Selecione a loja e o formulário para começar.</p>
        </div>

        <div className="bg-card rounded-xl shadow-lg border border-border p-8 space-y-6">
            {(user.role === 'admin' || user.role === 'supervisor') && (
                <div className="space-y-2">
                    <Label className="flex items-center gap-2 font-semibold"><Store className="w-5 h-5 text-primary"/> Etapa 1: Selecione a Loja</Label>
                    <Select onValueChange={setSelectedStoreId} value={selectedStoreId}>
                        <SelectTrigger><SelectValue placeholder="Escolha uma loja para avaliar..." /></SelectTrigger>
                        <SelectContent>
                            {availableStores.map(store => <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            )}
             {user.role === 'loja' && selectedStoreId && (
                <div className="space-y-2">
                     <Label className="flex items-center gap-2 font-semibold"><Store className="w-5 h-5 text-primary"/> Loja Selecionada</Label>
                     <p className='p-2 bg-secondary rounded-md'>{availableStores[0]?.name}</p>
                </div>
            )}
            
            <AnimatePresence>
            {selectedStoreId && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="space-y-2"
                >
                    <Label className="flex items-center gap-2 font-semibold"><FileText className="w-5 h-5 text-primary"/> Etapa 2: Escolha o Formulário</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {forms.map(form => {
                            const Icon = pillarIcons[form.pillar]?.icon || FileText;
                            const color = pillarIcons[form.pillar]?.color || 'text-foreground';
                            return (
                                <motion.button 
                                    key={form.id}
                                    whileHover={{ y: -5 }}
                                    onClick={() => setSelectedFormId(form.id)}
                                    className={`p-4 bg-secondary rounded-lg border text-left flex flex-col justify-between items-start transition-all ${selectedFormId === form.id ? 'border-primary' : 'border-transparent'}`}
                                >
                                    <Icon className={`w-8 h-8 mb-2 ${color}`} />
                                    <p className="font-semibold text-foreground">{form.title}</p>
                                    <p className="text-xs text-muted-foreground">{form.pillar}</p>
                                </motion.button>
                            )
                        })}
                    </div>
                </motion.div>
            )}
            </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default StartEvaluation;