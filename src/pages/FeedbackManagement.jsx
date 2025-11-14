import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { motion } from 'framer-motion';
import { Diamond, Frown, Meh, Smile, Laugh, Search, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

const satisfactionIcons = {
  1: { icon: Frown, color: 'text-red-400', label: 'Ruim' },
  2: { icon: Meh, color: 'text-orange-400', label: 'Razoável' },
  3: { icon: Smile, color: 'text-yellow-400', label: 'Bom' },
  4: { icon: Laugh, color: 'text-green-400', label: 'Excelente' },
};

const FeedbackCard = ({ feedback, store, collaborator }) => {
  const SatisfactionIcon = satisfactionIcons[feedback.satisfaction]?.icon || Meh;
  const satisfactionColor = satisfactionIcons[feedback.satisfaction]?.color || 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-5 rounded-xl border border-border shadow-sm"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-foreground">{collaborator?.name || 'Colaborador não encontrado'}</h3>
          <p className="text-sm text-muted-foreground">{store?.name || 'Loja não encontrada'}</p>
          <p className="text-xs text-muted-foreground">{new Date(feedback.date).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {feedback.isPromotionCandidate && <Diamond className="w-5 h-5 text-yellow-400" />}
          <SatisfactionIcon className={cn("w-7 h-7", satisfactionColor)} />
        </div>
      </div>
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold text-foreground">Pontos Positivos:</p>
          <p className="text-muted-foreground">{feedback.feedbackText}</p>
        </div>
        {feedback.developmentPoint && (
          <div>
            <p className="font-semibold text-foreground">Ponto a Desenvolver:</p>
            <p className="text-muted-foreground">{feedback.developmentPoint}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FeedbackManagement = () => {
  const { feedbacks, collaborators, stores, fetchData } = useData();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showHighlights, setShowHighlights] = useState(false);
  const [satisfactionFilter, setSatisfactionFilter] = useState([]);

  // Refresh automático a cada 30 segundos para ver novos feedbacks em tempo real
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, 30000); // 30 segundos

    return () => clearInterval(interval);
  }, [fetchData]);

  const groupedFeedbacks = useMemo(() => {
    const filtered = feedbacks
      .map(fb => ({
        ...fb,
        collaborator: collaborators.find(c => c.id === fb.collaboratorId),
        store: stores.find(s => s.id === fb.storeId),
      }))
      .filter(fb => {
        if (showHighlights && !fb.isPromotionCandidate) return false;
        if (satisfactionFilter.length > 0 && !satisfactionFilter.includes(String(fb.satisfaction))) return false;
        
        const search = searchTerm.toLowerCase();
        if (!search) return true;

        return (
          fb.collaborator?.name.toLowerCase().includes(search) ||
          fb.store?.name.toLowerCase().includes(search) ||
          fb.feedbackText.toLowerCase().includes(search) ||
          (fb.developmentPoint && fb.developmentPoint.toLowerCase().includes(search))
        );
      });

    return filtered.reduce((acc, fb) => {
        if (!fb.store) return acc;
        if (!acc[fb.storeId]) {
            acc[fb.storeId] = { storeInfo: fb.store, feedbacks: [] };
        }
        acc[fb.storeId].feedbacks.push(fb);
        return acc;
    }, {});
  }, [feedbacks, collaborators, stores, searchTerm, showHighlights, satisfactionFilter]);

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada. Mas não se preocupe, você pode solicitá-la no próximo prompt! 🚀',
    });
  };
  
  const storeIdsWithFeedbacks = Object.keys(groupedFeedbacks);

  return (
    <>
      <Helmet>
        <title>Gestão de Feedbacks - MYFEET</title>
        <meta name="description" content="Visualize e gerencie os feedbacks dos colaboradores." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestão de Feedbacks</h1>
                    <p className="text-muted-foreground mt-1">Visualize e filtre os feedbacks enviados pelas lojas.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Extrair PDF
                </Button>
            </div>
            <div className="bg-card border border-border p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por loja, colaborador ou texto..."
                        className="pl-9 w-full bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                     <div className="flex items-center space-x-2 justify-end">
                        <Switch id="highlights-only" checked={showHighlights} onCheckedChange={setShowHighlights} />
                        <Label htmlFor="highlights-only" className="flex items-center gap-2">
                            <Diamond className="w-4 h-4 text-yellow-400" /> Apenas Destaques
                        </Label>
                    </div>
                </div>
                 <div>
                    <Label className="text-sm font-medium mb-2 block">Filtrar por satisfação:</Label>
                    <ToggleGroup 
                        type="multiple" 
                        variant="outline" 
                        value={satisfactionFilter} 
                        onValueChange={setSatisfactionFilter}
                    >
                        {Object.entries(satisfactionIcons).map(([level, {icon: Icon, label, color}]) => (
                            <ToggleGroupItem key={level} value={level} aria-label={`Filtrar por ${label}`} className="flex gap-1.5">
                                <Icon className={cn("w-4 h-4", color)} /> {label}
                            </ToggleGroupItem>
                        ))}
                    </ToggleGroup>
                </div>
            </div>
        </div>

        {storeIdsWithFeedbacks.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {storeIdsWithFeedbacks.map(storeId => {
              const { storeInfo, feedbacks: storeFeedbacks } = groupedFeedbacks[storeId];
              return (
                <AccordionItem key={storeId} value={storeId} className="bg-card border border-border rounded-lg shadow-sm">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-foreground">{storeInfo.name}</h2>
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{storeFeedbacks.length}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {storeFeedbacks.sort((a,b) => new Date(b.date) - new Date(a.date)).map(feedback => (
                        <FeedbackCard
                          key={feedback.id}
                          feedback={feedback}
                          store={feedback.store}
                          collaborator={feedback.collaborator}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
            <p className="text-lg">Nenhum feedback encontrado.</p>
            <p className="text-sm">Tente ajustar seus filtros ou aguarde novos feedbacks.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackManagement;