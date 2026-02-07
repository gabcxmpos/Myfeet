import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, Diamond, Frown, Meh, Smile, Laugh } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const satisfactionLevels = [
  { level: 1, icon: Frown, color: 'text-red-500', label: 'Ruim' },
  { level: 2, icon: Meh, color: 'text-orange-500', label: 'Razoável' },
  { level: 3, icon: Smile, color: 'text-yellow-500', label: 'Bom' },
  { level: 4, icon: Laugh, color: 'text-green-500', label: 'Excelente' },
];

const Feedback = () => {
  const { user } = useAuth();
  const { collaborators, addFeedback } = useData();
  const { toast } = useToast();

  const [collaboratorId, setCollaboratorId] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [developmentPoint, setDevelopmentPoint] = useState('');
  const [satisfaction, setSatisfaction] = useState(3);
  const [managerSatisfaction, setManagerSatisfaction] = useState(3); // Satisfação do gerente com o colaborador
  const [collaboratorSatisfaction, setCollaboratorSatisfaction] = useState(3); // Satisfação do colaborador
  const [isPromotionCandidate, setIsPromotionCandidate] = useState(false);

  const storeCollaborators = collaborators.filter(c => c.storeId === user?.storeId || c.store_id === user?.storeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!collaboratorId || !feedbackText) {
      toast({ title: 'Erro', description: 'Selecione um colaborador e escreva o feedback.', variant: 'destructive' });
      return;
    }
    
    if (!user?.storeId) {
      toast({ title: 'Erro', description: 'Usuário não possui loja associada.', variant: 'destructive' });
      return;
    }
    
    try {
      await addFeedback({
        store_id: user.storeId, // Usar snake_case (padrão do banco)
        collaborator_id: collaboratorId,
        feedback_text: feedbackText,
        development_point: developmentPoint,
        satisfaction,
        managerSatisfaction,
        collaboratorSatisfaction,
        isPromotionCandidate,
      });
      toast({ title: 'Sucesso!', description: 'Feedback enviado para o supervisor.' });
      setCollaboratorId('');
      setFeedbackText('');
      setDevelopmentPoint('');
      setSatisfaction(3);
      setManagerSatisfaction(3);
      setCollaboratorSatisfaction(3);
      setIsPromotionCandidate(false);
    } catch (error) {
      // Erro já é tratado no DataContext
      console.error('Erro ao enviar feedback:', error);
    }
  };

  return (
    <>
      <Helmet><title>Feedback para Colaborador - MYFEET</title></Helmet>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Feedback para Colaborador</h1>
          <p className="text-muted-foreground mt-1">Registre feedbacks para sua equipe.</p>
        </div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="bg-card p-8 rounded-xl shadow-lg border border-border space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <Label htmlFor="collaborator">Colaborador</Label>
              <Select onValueChange={setCollaboratorId} value={collaboratorId}>
                <SelectTrigger id="collaborator" className="bg-secondary"><SelectValue placeholder="Selecione um colaborador..." /></SelectTrigger>
                <SelectContent>
                  {storeCollaborators.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Satisfação do Gerente com o Colaborador</Label>
              <div className="flex items-center justify-around p-2 bg-secondary rounded-lg">
                {satisfactionLevels.map(({level, icon: Icon, color}) => (
                  <button key={level} type="button" onClick={() => setManagerSatisfaction(level)} className="p-2 rounded-full transition-all duration-200 hover:bg-accent">
                    <Icon className={cn("w-8 h-8", managerSatisfaction === level ? color : 'text-muted-foreground/50')} />
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Satisfação do Colaborador</Label>
            <div className="flex items-center justify-around p-2 bg-secondary rounded-lg">
              {satisfactionLevels.map(({level, icon: Icon, color}) => (
                <button key={level} type="button" onClick={() => setCollaboratorSatisfaction(level)} className="p-2 rounded-full transition-all duration-200 hover:bg-accent">
                  <Icon className={cn("w-8 h-8", collaboratorSatisfaction === level ? color : 'text-muted-foreground/50')} />
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="feedbackText">Feedback Descritivo (Pontos Positivos)</Label>
            <Textarea id="feedbackText" value={feedbackText} onChange={e => setFeedbackText(e.target.value)} required placeholder="Descreva os pontos positivos observados..." className="bg-secondary min-h-[120px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="developmentPoint">Ponto a Desenvolver</Label>
            <Textarea id="developmentPoint" value={developmentPoint} onChange={e => setDevelopmentPoint(e.target.value)} placeholder="Qual principal ponto a ser desenvolvido?" className="bg-secondary min-h-[60px]" />
          </div>

          <div className="flex items-center justify-between">
            <Button
                type="button"
                variant={isPromotionCandidate ? 'secondary' : 'outline'}
                onClick={() => setIsPromotionCandidate(!isPromotionCandidate)}
                className={cn("gap-2 transition-all", isPromotionCandidate && 'bg-yellow-400/20 text-yellow-300 border-yellow-400/50')}
            >
                <Diamond className="w-4 h-4" />
                {isPromotionCandidate ? 'Candidato à Promoção' : 'Marcar como Destaque'}
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-primary to-blue-500 text-primary-foreground gap-2">
                <Send className="w-4 h-4" /> Enviar Feedback
            </Button>
          </div>
        </motion.form>
      </div>
    </>
  );
};

export default Feedback;