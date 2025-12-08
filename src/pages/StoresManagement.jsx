import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { updateStore as updateStoreAPI } from '@/lib/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Store, Edit, Trash2, Eye, MoreVertical, Search, CheckCircle, Flame, Target, TrendingUp, DollarSign, Percent, Hash, Truck, BarChart as BarChartIcon, Globe, Trophy, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Users, AlertCircle, FileText, Download, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Card, CardContent } from '@/components/ui/card';

const kpiMapping = {
    faturamento: 'Faturamento',
    pa: 'P.A.',
    ticketMedio: 'Ticket Médio',
    prateleiraInfinita: 'Prateleira Infinita',
    conversao: 'Conversão',
};

const resultFields = [
    { name: 'faturamento', label: 'Faturamento', icon: DollarSign, placeholder: 'Ex: 150000' },
    { name: 'pa', label: 'P.A.', icon: Hash, placeholder: 'Ex: 2.8' },
    { name: 'ticketMedio', label: 'Ticket Médio', icon: Percent, placeholder: 'Ex: 250.50' },
    { name: 'prateleiraInfinita', label: 'Prateleira Infinita', icon: Truck, placeholder: 'Ex: 15000' },
    { name: 'conversao', label: 'Conversão (%)', icon: BarChartIcon, placeholder: 'Ex: 15' },
];

const formatValue = (key, value) => {
    const val = Number(value) || 0;
    if (key === 'faturamento' || key === 'ticketMedio' || key === 'prateleiraInfinita') {
        return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (key === 'conversao') {
        return `${val.toFixed(1)}%`;
    }
    if (key === 'pa') {
        return val.toFixed(2);
    }
    return val;
};

const PerformanceCarousel = ({ stores }) => {
    const [selectedKpi, setSelectedKpi] = useState('ticketMedio');
    const [currentIndex, setCurrentIndex] = useState(0);

    const performanceData = useMemo(() => {
        if (!stores) return { top: [], bottom: [] };
        // Usar mês atual como padrão
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const data = stores.map(store => {
            // Buscar metas usando JSONB (goals[currentMonth])
            const storeGoals = store.goals || {};
            const goals = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
              ? (storeGoals[currentMonth] || {})
              : (storeGoals || {});
            
            // Buscar resultados usando JSONB (store_results[currentMonth])
            const storeResults = store.store_results || {};
            const results = typeof storeResults === 'object' && !Array.isArray(storeResults)
              ? (storeResults[currentMonth] || {})
              : {};
            
            const goal = goals[selectedKpi] || 0;
            const result = results[selectedKpi] || 0;
            const percentage = goal > 0 ? (result / goal) * 100 : 0;
            return {
                storeName: store.name,
                code: store.code,
                percentage,
                goal,
                result,
                kpiKey: selectedKpi,
            };
        }).sort((a, b) => b.percentage - a.percentage);
        
        return {
            top: data.slice(0, 5),
            bottom: data.slice(-5).reverse(),
        };
    }, [stores, selectedKpi]);
    
    const items = [...performanceData.top, ...performanceData.bottom];

    const nextSlide = () => {
        setCurrentIndex(prev => (prev === items.length - 1 ? 0 : prev + 1));
    }
    const prevSlide = () => {
        setCurrentIndex(prev => (prev === 0 ? items.length - 1 : prev - 1));
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card p-4 rounded-xl border border-border mb-6"
        >
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2"><Globe className="w-5 h-5 text-primary"/>Destaques de Performance</h2>
                <ToggleGroup type="single" value={selectedKpi} onValueChange={(value) => { if(value) setSelectedKpi(value) }} className="flex-wrap justify-center">
                    {Object.entries(kpiMapping).map(([key, name]) => (
                        <ToggleGroupItem key={key} value={key} aria-label={`Selecionar ${name}`} className="text-xs px-2 h-8">{name}</ToggleGroupItem>
                    ))}
                </ToggleGroup>
            </div>
            
            <div className="relative flex items-center justify-center">
                 <Button variant="ghost" size="icon" onClick={prevSlide} className="absolute left-0 z-10 hidden md:inline-flex"><ChevronLeft/></Button>
                 <div className="w-full md:w-3/4 lg:w-1/2 overflow-hidden">
                    <AnimatePresence mode="wait">
                         <motion.div
                            key={currentIndex}
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.3 }}
                            className="w-full"
                         >
                            {items[currentIndex] && (
                                <Card className={cn("border-2", currentIndex < 5 ? "border-green-500/50 bg-green-500/5" : "border-red-500/50 bg-red-500/5")}>
                                    <CardContent className="p-4 flex flex-col items-center text-center">
                                         {currentIndex < 5 ? <ChevronsUp className="w-8 h-8 text-green-500 mb-2"/> : <ChevronsDown className="w-8 h-8 text-red-500 mb-2"/>}
                                        <p className="font-bold text-lg text-foreground truncate">{items[currentIndex].storeName}</p>
                                        <p className="text-sm text-muted-foreground">{items[currentIndex].code}</p>
                                        <p className="font-bold text-3xl my-2 text-primary">{items[currentIndex].percentage.toFixed(0)}<span className="text-lg">%</span></p>
                                        <div className="text-xs text-muted-foreground">
                                            <p>Resultado: {formatValue(items[currentIndex].kpiKey, items[currentIndex].result)}</p>
                                            <p>Meta: {formatValue(items[currentIndex].kpiKey, items[currentIndex].goal)}</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                         </motion.div>
                    </AnimatePresence>
                 </div>
                 <Button variant="ghost" size="icon" onClick={nextSlide} className="absolute right-0 z-10 hidden md:inline-flex"><ChevronRight/></Button>
            </div>
        </motion.div>
    );
};

const StoreGoalThermometer = ({ store }) => {
    const [selectedKpi, setSelectedKpi] = useState('faturamento');
    
    useEffect(() => {
        setSelectedKpi('faturamento');
    }, [store.id]);

    // Usar mês atual como padrão
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Buscar metas usando JSONB (goals[currentMonth])
    const storeGoals = store?.goals || {};
    const goals = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
      ? (storeGoals[currentMonth] || {})
      : (storeGoals || {});
    
    // Buscar resultados usando JSONB (store_results[currentMonth])
    const storeResults = store?.store_results || {};
    const results = typeof storeResults === 'object' && !Array.isArray(storeResults)
      ? (storeResults[currentMonth] || {})
      : {};
    
    if (!store || (!goals[selectedKpi] && !store.goals?.[selectedKpi]) || (!results[selectedKpi] && !store.results?.[selectedKpi])) return null;

    const goal = goals[selectedKpi] || 0;
    const result = results[selectedKpi] || 0;
    const percentage = goal > 0 ? Math.min(Math.round((result / goal) * 100), 150) : 0;
    
    let bgColor = 'bg-red-500';
    if (percentage >= 100) bgColor = 'bg-green-500';
    else if (percentage >= 70) bgColor = 'bg-yellow-500';

    return (
      <div className="mt-4 border-t border-border pt-4">
        <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-1.5"><Flame className="w-4 h-4"/>Termômetro</h4>
             <Select onValueChange={setSelectedKpi} value={selectedKpi}>
                <SelectTrigger className="w-32 h-8 text-xs bg-secondary border-border/80"><SelectValue /></SelectTrigger>
                <SelectContent>
                    {Object.entries(kpiMapping).map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="relative w-full h-8 bg-secondary rounded-full overflow-hidden border border-border/50">
            <motion.div 
                className={cn("h-full rounded-full flex items-center justify-center text-white font-bold text-xs", bgColor)}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(percentage, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
            >
                {percentage}%
            </motion.div>
             {percentage > 100 && (
                <div className="absolute top-0 h-full bg-cyan-400" style={{ left: '100%', width: `${Math.min(percentage - 100, 50)}%` }} />
            )}
        </div>
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>Meta: {formatValue(selectedKpi, goal)}</span>
            <span>Atingido: {formatValue(selectedKpi, result)}</span>
        </div>
      </div>
    );
};

const StoreFormModal = ({ store, onSave, onOpenChange }) => {
  const [formData, setFormData] = useState(store || {
    code: '', name: '', bandeira: '', shopping: '', manager: '', supervisor: '', franqueado: '', estado: '', telefone: '', tipo: 'propria'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const fields = [
    { name: 'code', label: 'Código (Ex: AW001)' },
    { name: 'name', label: 'Nome da Loja' },
    { name: 'shopping', label: 'Shopping' },
    { name: 'manager', label: 'Responsável' },
    { name: 'supervisor', label: 'Supervisor' },
    { name: 'franqueado', label: 'Franqueado' },
    { name: 'estado', label: 'Estado (UF)' },
    { name: 'telefone', label: 'Telefone' },
  ];

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle>{store ? 'Editar Loja' : 'Cadastrar Nova Loja'}</DialogTitle>
        <DialogDescription>
          {store ? 'Edite as informações da loja abaixo.' : 'Preencha os dados para cadastrar uma nova loja.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fields.map(field => (
            <div className="space-y-2" key={field.name}>
              <Label htmlFor={field.name}>{field.label}</Label>
              <Input id={field.name} name={field.name} value={formData[field.name] || ''} onChange={handleChange} required className="bg-secondary" />
            </div>
          ))}
          <div className="space-y-2">
            <Label htmlFor="bandeira">Bandeira</Label>
            <Select onValueChange={(value) => handleSelectChange('bandeira', value)} value={formData.bandeira}>
              <SelectTrigger id="bandeira" className="bg-secondary"><SelectValue placeholder="Selecione a bandeira..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ARTWALK">ARTWALK</SelectItem>
                <SelectItem value="AUTHENTIC FEET">AUTHENTIC FEET</SelectItem>
                <SelectItem value="MAGICFEET">MAGICFEET</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Loja *</Label>
            <Select onValueChange={(value) => handleSelectChange('tipo', value)} value={formData.tipo || 'propria'}>
              <SelectTrigger id="tipo" className="bg-secondary"><SelectValue placeholder="Selecione o tipo..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="propria">Própria</SelectItem>
                <SelectItem value="franquia">Franquia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{store ? 'Salvar Alterações' : 'Cadastrar Loja'}</Button>
      </form>
    </DialogContent>
  );
};

const EvaluationDetailModal = ({ evaluation, form, onOpenChange, users }) => {
  if (!evaluation) return null;

  const approvedByUser = evaluation.approvedByUser || (evaluation.approved_by || evaluation.approvedBy ? users?.find(u => u.id === (evaluation.approved_by || evaluation.approvedBy)) : null);
  const createdByUser = evaluation.app_user || (evaluation.userId ? users?.find(u => u.id === evaluation.userId) : null);

  return (
    <DialogContent className="max-w-3xl bg-card border-border max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center justify-between">
          <span>Detalhes da Avaliação - {evaluation.pillar}</span>
        </DialogTitle>
        <DialogDescription>
          Visualize todos os detalhes e respostas desta avaliação.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        <div className="bg-secondary p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Pontuação</p>
              <p className="text-2xl font-bold text-primary">{evaluation.score} pts</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className={cn("font-bold", evaluation.status === 'pending' ? 'text-yellow-500' : 'text-green-500')}>
                {evaluation.status === 'pending' ? 'Pendente' : 'Aprovada'}
              </p>
              {evaluation.status === 'approved' && approvedByUser && (
                <p className="text-xs text-muted-foreground mt-1">
                  Aprovada por: <span className="font-semibold text-primary">{approvedByUser.username || approvedByUser.name || 'Usuário'}</span>
                </p>
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Data</p>
              <p className="font-medium">{new Date(evaluation.date || evaluation.created_at).toLocaleDateString('pt-BR')}</p>
            </div>
            {createdByUser && (
              <div>
                <p className="text-sm text-muted-foreground">Enviada por</p>
                <p className="font-medium">{createdByUser.username || createdByUser.name || 'Usuário'}</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Respostas</h3>
          {form && form.questions && form.questions.length > 0 ? (
            form.questions.map((question, index) => {
              const answer = evaluation.answers?.[question.id];
              return (
                <div key={question.id} className="bg-secondary p-4 rounded-lg">
                  <p className="font-semibold mb-2">{index + 1}. {question.text}</p>
                  {question.subtitle && <p className="text-sm text-muted-foreground mb-3">{question.subtitle}</p>}
                  <div className="mt-2">
                    {question.type === 'satisfaction' && (
                      <div>
                        <p className="font-medium">Nota: {answer || 0}/10</p>
                        <div className="w-full bg-secondary rounded-full h-2 mt-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: `${((answer || 0) / 10) * 100}%` }} />
                        </div>
                      </div>
                    )}
                    {question.type === 'multiple-choice' && (
                      <p className="font-medium">{answer || 'Não respondido'}</p>
                    )}
                    {question.type === 'checkbox' && (
                      <div className="space-y-1">
                        {Array.isArray(answer) && answer.length > 0 ? (
                          answer.map((item, idx) => (
                            <p key={idx} className="font-medium">• {item}</p>
                          ))
                        ) : (
                          <p className="text-muted-foreground">Nenhuma opção selecionada</p>
                        )}
                      </div>
                    )}
                    {question.type === 'text' && (
                      <p className="font-medium whitespace-pre-wrap">{answer || 'Sem resposta'}</p>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-muted-foreground">Formulário não encontrado ou sem questões. Carregando informações básicas...</p>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

const PendingEvaluationsModal = ({ store, onOpenChange, onDelete, onApprove, onViewDetail }) => {
  const { evaluations, users } = useData();
  const { user } = useAuth();
  const pendingEvaluations = evaluations
    .filter(ev => ev.storeId === store.id && ev.status === 'pending')
    .sort((a, b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle>Avaliações Pendentes - {store.name}</DialogTitle>
        <DialogDescription>
          Lista de avaliações aguardando aprovação para esta loja.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
        {pendingEvaluations.length > 0 ? pendingEvaluations.map(ev => {
          const createdByUser = ev.app_user || (ev.userId ? users?.find(u => u.id === ev.userId) : null);
          return (
            <div key={ev.id} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold">{ev.pillar} - <span className="text-primary">{ev.score} pts</span></p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(ev.date || ev.created_at).toLocaleDateString('pt-BR')} - 
                  <span className="ml-1 font-bold text-yellow-500">Pendente</span>
                  {createdByUser && (
                    <span className="ml-2">• Enviada por: <span className="font-semibold">{createdByUser.username || createdByUser.name || 'Usuário'}</span></span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onViewDetail(ev)} title="Ver detalhes">
                  <Eye className="w-5 h-5 text-blue-500 hover:text-blue-400" />
                </Button>
                {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'supervisor_franquia' || user.role === 'comunicação') && (
                  <Button variant="ghost" size="icon" onClick={() => onApprove(ev.id)} title="Aprovar">
                    <CheckCircle className="w-5 h-5 text-green-500 hover:text-green-400" />
                  </Button>
                )}
                {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'supervisor_franquia' || user.role === 'comunicação') && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(ev.id)} title="Excluir">
                    <Trash2 className="w-5 h-5 text-destructive hover:text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          );
        }) : <p className="text-muted-foreground text-center py-4">Nenhuma avaliação pendente para esta loja.</p>}
      </div>
    </DialogContent>
  );
};

const ViewEvaluationsModal = ({ store, onOpenChange, onDelete, onApprove, onViewDetail }) => {
  const { evaluations, users } = useData();
  const { user } = useAuth();
  const storeEvaluations = evaluations.filter(ev => ev.storeId === store.id).sort((a,b) => new Date(b.date || b.created_at) - new Date(a.date || a.created_at));

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle>Avaliações de {store.name}</DialogTitle>
        <DialogDescription>
          Visualize todas as avaliações desta loja.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
        {storeEvaluations.length > 0 ? storeEvaluations.map(ev => {
          const approvedByUser = ev.approvedByUser || (ev.approved_by || ev.approvedBy ? users?.find(u => u.id === (ev.approved_by || ev.approvedBy)) : null);
          const createdByUser = ev.app_user || (ev.userId ? users?.find(u => u.id === ev.userId) : null);
          
          return (
            <div key={ev.id} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
              <div className="flex-1">
                <div 
                  className={cn("cursor-pointer", ev.status === 'approved' && approvedByUser && "hover:underline")}
                  onClick={ev.status === 'approved' && approvedByUser ? () => onViewDetail(ev) : undefined}
                  title={ev.status === 'approved' && approvedByUser ? "Clique para ver detalhes" : ""}
                >
                  <p className="font-semibold">{ev.pillar} - <span className="text-primary">{ev.score} pts</span></p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(ev.date || ev.created_at).toLocaleDateString('pt-BR')} - 
                    <span className={cn("ml-1 font-bold", ev.status === 'pending' ? 'text-yellow-500' : 'text-green-500')}>
                      {ev.status === 'pending' ? 'Pendente' : 'Aprovada'}
                    </span>
                    {ev.status === 'approved' && approvedByUser && (
                      <span className="ml-2 text-primary font-semibold cursor-pointer hover:underline">
                        • Aprovada por: {approvedByUser.username || approvedByUser.name || 'Usuário'}
                      </span>
                    )}
                    {createdByUser && ev.status === 'pending' && (
                      <span className="ml-2">• Enviada por: <span className="font-semibold">{createdByUser.username || createdByUser.name || 'Usuário'}</span></span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => onViewDetail(ev)} title="Ver detalhes">
                  <Eye className="w-5 h-5 text-blue-500 hover:text-blue-400" />
                </Button>
                {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'comunicação') && ev.status === 'pending' && (
                  <Button variant="ghost" size="icon" onClick={() => onApprove(ev.id)}><CheckCircle className="w-5 h-5 text-green-500 hover:text-green-400" /></Button>
                )}
                {(user.role === 'admin' || user.role === 'supervisor' || user.role === 'supervisor_franquia' || user.role === 'comunicação') && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(ev.id)}><Trash2 className="w-5 h-5 text-destructive hover:text-red-400" /></Button>
                )}
              </div>
            </div>
          );
        }) : <p className="text-muted-foreground text-center py-4">Nenhuma avaliação encontrada para esta loja.</p>}
      </div>
    </DialogContent>
  );
}

const HeadcountModal = ({ store, collaborators, jobRoles, onOpenChange }) => {
  // Filtrar colaboradores da loja (apenas ativos para headcount)
  const storeCollaborators = useMemo(() => {
    if (!collaborators || !store) return [];
    return collaborators.filter(c => 
      (c.storeId === store.id || c.store_id === store.id)
    );
  }, [collaborators, store]);

  // Colaboradores ativos (para headcount)
  const activeCollaborators = useMemo(() => {
    return storeCollaborators.filter(c => (c.status || 'ativo') === 'ativo');
  }, [storeCollaborators]);

  // Agrupar colaboradores por cargo
  const collaboratorsByRole = useMemo(() => {
    const grouped = {};
    
    // Debug: verificar dados recebidos
    console.log('🔍 [HeadcountModal] Dados recebidos:', {
      activeCollaborators: activeCollaborators.length,
      jobRoles: jobRoles?.length || 0,
      sampleCollaborator: activeCollaborators[0]
    });
    
    // Inicializar todos os cargos configurados com arrays vazios
    if (jobRoles && jobRoles.length > 0) {
      jobRoles.forEach(role => {
        grouped[role] = [];
      });
    }
    
    // Agrupar colaboradores ativos por cargo
    activeCollaborators.forEach(collab => {
      // Obter o cargo do colaborador, normalizado
      const collabRole = collab.role ? String(collab.role).trim() : null;
      
      if (!collabRole || collabRole === '') {
        // Colaborador sem cargo definido
        if (!grouped['Sem cargo']) {
          grouped['Sem cargo'] = [];
        }
        grouped['Sem cargo'].push(collab);
      } else {
        // Verificar se o cargo existe na lista de jobRoles (comparação exata)
        if (jobRoles && jobRoles.includes(collabRole)) {
          // Cargo está na lista configurada
          if (!grouped[collabRole]) {
            grouped[collabRole] = [];
          }
          grouped[collabRole].push(collab);
        } else {
          // Cargo não está na lista de jobRoles configurados
          // Adicionar mesmo assim para não perder dados
          if (!grouped[collabRole]) {
            grouped[collabRole] = [];
          }
          grouped[collabRole].push(collab);
        }
      }
    });
    
    // Debug: verificar resultado do agrupamento
    console.log('📊 [HeadcountModal] Agrupamento final:', {
      totalRoles: Object.keys(grouped).length,
      rolesWithCollaborators: Object.keys(grouped).filter(role => grouped[role].length > 0),
      grouped
    });
    
    return grouped;
  }, [activeCollaborators, jobRoles]);

  const totalCollaborators = activeCollaborators.length;

  return (
    <DialogContent className="max-w-3xl bg-card border-border">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Headcount - {store?.name}
        </DialogTitle>
        <DialogDescription>
          Distribuição de colaboradores por cargo nesta loja.
        </DialogDescription>
      </DialogHeader>
      <div className="mt-4 space-y-4">
        {/* Total de colaboradores */}
        <div className="bg-secondary/50 p-4 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Total de Colaboradores</span>
            <span className="text-2xl font-bold text-primary">{totalCollaborators}</span>
          </div>
        </div>

        {/* Lista de cargos e quantidades */}
        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2">
          {jobRoles && jobRoles.length > 0 ? (
            <>
              {/* Primeiro, mostrar os cargos configurados */}
              {jobRoles.map(role => {
                const count = collaboratorsByRole[role]?.length || 0;
                const roleCollaborators = collaboratorsByRole[role] || [];
                
                return (
                  <div key={role} className="bg-secondary/50 p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{role}</h3>
                      <span className="text-lg font-bold text-primary">{count}</span>
                    </div>
                    {roleCollaborators.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {roleCollaborators.map(collab => (
                          <div key={collab.id} className="text-sm text-muted-foreground pl-2 border-l-2 border-primary/30">
                            {collab.name}
                            {collab.cpf && <span className="ml-2 text-xs">• CPF: {collab.cpf}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Depois, mostrar cargos não configurados mas que existem nos colaboradores */}
              {Object.keys(collaboratorsByRole).map(role => {
                // Pular se o cargo já foi mostrado acima (está em jobRoles) ou é "Sem cargo"
                if ((jobRoles && jobRoles.includes(role)) || role === 'Sem cargo') {
                  return null;
                }
                
                const count = collaboratorsByRole[role]?.length || 0;
                const roleCollaborators = collaboratorsByRole[role] || [];
                
                if (count === 0) return null;
                
                return (
                  <div key={role} className="bg-yellow-500/10 border-yellow-500/30 p-4 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-foreground">{role}</h3>
                      <span className="text-lg font-bold text-yellow-500">{count}</span>
                    </div>
                    {roleCollaborators.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {roleCollaborators.map(collab => (
                          <div key={collab.id} className="text-sm text-muted-foreground pl-2 border-l-2 border-yellow-500/30">
                            {collab.name}
                            {collab.cpf && <span className="ml-2 text-xs">• CPF: {collab.cpf}</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum cargo cadastrado.</p>
              <p className="text-xs mt-2">O administrador precisa cadastrar os cargos primeiro.</p>
            </div>
          )}
        </div>

        {/* Colaboradores sem cargo (apenas ativos) */}
        {collaboratorsByRole['Sem cargo'] && collaboratorsByRole['Sem cargo'].length > 0 && (
          <div className="bg-yellow-500/10 border-yellow-500/30 p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-foreground">Sem cargo atribuído</h3>
              <span className="text-lg font-bold text-yellow-500">{collaboratorsByRole['Sem cargo'].length}</span>
            </div>
            <div className="mt-2 space-y-1">
              {collaboratorsByRole['Sem cargo'].map(collab => (
                <div key={collab.id} className="text-sm text-muted-foreground pl-2 border-l-2 border-yellow-500/30">
                  {collab.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DialogContent>
  );
}

const StoresManagement = () => {
  const { stores, addStore, updateStore, deleteStore, deleteEvaluation, approveEvaluation, fetchData, collaborators, jobRoles, evaluations, users, forms } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const canManageStores = user?.role === 'admin' || user?.role === 'supervisor' || user?.role === 'supervisor_franquia' || user?.role === 'comunicação';

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

  const [franqueadoFilter, setFranqueadoFilter] = useState('all'); // 'all' ou nome do franqueado
  const [resultMonthCSV, setResultMonthCSV] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isUploadingResults, setIsUploadingResults] = useState(false);
  const resultsFileInputRef = React.useRef(null);
  
  // Primeiro filtrar por tipo (própria vs franquia)
  const storesByType = useMemo(() => {
    let filtered = filterStoresByUserType(stores, user?.role, user?.storeId);
    
    // Aplicar filtro de franqueado se selecionado
    if (franqueadoFilter !== 'all') {
      filtered = filtered.filter(s => {
        const franqueado = s.franqueado || 'Loja Própria';
        return franqueado === franqueadoFilter;
      });
    }
    
    return filtered;
  }, [stores, user?.role, user?.storeId, franqueadoFilter]);
  
  // Lista de franqueados disponíveis
  const franqueados = useMemo(() => {
    const filtered = filterStoresByUserType(stores, user?.role, user?.storeId);
    return ['all', ...new Set(filtered.map(s => s.franqueado || 'Loja Própria'))];
  }, [stores, user?.role, user?.storeId]);

  const filteredStores = useMemo(() => {
    return storesByType.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [storesByType, searchTerm]);

  // Calcular avaliações pendentes por loja
  const pendingEvaluationsByStore = useMemo(() => {
    const pending = {};
    evaluations?.forEach(ev => {
      if (ev.status === 'pending') {
        pending[ev.storeId] = (pending[ev.storeId] || 0) + 1;
      }
    });
    return pending;
  }, [evaluations]);

  const handleSaveStore = (storeData) => {
    if (storeData.id) {
      updateStore(storeData.id, storeData);
      toast({ title: "Loja atualizada!", description: `${storeData.name} foi atualizada.` });
    } else {
      addStore(storeData);
      toast({ title: "Loja cadastrada!", description: `${storeData.name} foi adicionada.` });
    }
    setModalState({ type: null, data: null });
  };


  // Função para limpar e converter valores numéricos (remove R$, pontos, vírgulas)
  const cleanNumericValue = (value) => {
    if (!value || value === '' || value.trim() === '') {
      return 0;
    }
    
    let cleaned = String(value).trim().toUpperCase();
    cleaned = cleaned.replace(/R\$\s*/g, '');
    cleaned = cleaned.replace(/\s/g, '');
    
    if (!cleaned || cleaned === '' || cleaned === '-') {
      return 0;
    }
    
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.') && cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts.length === 2) {
        cleaned = parts[0].replace(/\./g, '') + '.' + parts[1];
      } else {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else {
      if (cleaned.includes('.')) {
        const lastDotIndex = cleaned.lastIndexOf('.');
        const afterDot = cleaned.substring(lastDotIndex + 1);
        if (afterDot.length > 2) {
          cleaned = cleaned.replace(/\./g, '');
        }
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Função para gerar template CSV de resultados
  const generateResultsCSVTemplate = () => {
    const headers = [
      'codigo_loja',
      'mes_ano',
      'faturamento',
      'pa',
      'ticketMedio',
      'prateleiraInfinita',
      'conversao'
    ];
    
    const currentMonth = resultMonthCSV;
    const exampleRows = [
      ['af013', currentMonth, 'R$ 150.000,00', '2,8', '250,50', '15000', '15'],
      ['af015', currentMonth, '180000', '3.0', 'R$ 280,00', '', '18'],
      ['af017', '', 'R$ 200.000,50', '3,2', '300', '0', '20']
    ];
    
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_resultados.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: 'Template baixado!', 
      description: 'Preencha o arquivo com os resultados das lojas. A coluna "mes_ano" é opcional (formato YYYY-MM). Se vazia, usará o mês selecionado no formulário. Aceita valores formatados (R$, pontos, vírgulas) e células vazias.' 
    });
  };

  // Função para processar CSV de resultados
  const parseResultsCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados.');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredHeaders = ['codigo_loja', 'faturamento', 'pa', 'ticketmedio', 'prateleinfinita', 'conversao'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'codigo_loja' || header === 'mes_ano') {
          row[header] = value;
        } else {
          row[header] = value;
        }
      });
      data.push(row);
    }
    
    return data;
  };

  // Função para fazer upload e processar CSV de resultados
  const handleCSVUploadResults = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({ 
        title: 'Erro', 
        description: 'Por favor, selecione um arquivo CSV.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsUploadingResults(true);
    
    try {
      const text = await file.text();
      const csvData = parseResultsCSV(text);
      
      if (csvData.length === 0) {
        throw new Error('Nenhum dado encontrado no CSV.');
      }
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const row of csvData) {
        const codigoLoja = row.codigo_loja || row['codigo_loja'];
        if (!codigoLoja) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Código da loja não fornecido`);
          errorCount++;
          continue;
        }
        
        const store = stores.find(s => s.code?.toLowerCase() === codigoLoja.toLowerCase());
        if (!store) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Loja com código "${codigoLoja}" não encontrada`);
          errorCount++;
          continue;
        }
        
        const results = {
          faturamento: cleanNumericValue(row.faturamento),
          pa: cleanNumericValue(row.pa),
          ticketMedio: cleanNumericValue(row.ticketmedio),
          prateleiraInfinita: cleanNumericValue(row.prateleinfinita),
          conversao: cleanNumericValue(row.conversao)
        };
        
        const rowMonth = row.mes_ano || row['mes_ano'] || '';
        let targetMonth = resultMonthCSV;
        if (rowMonth && rowMonth.trim() !== '') {
          const monthRegex = /^\d{4}-\d{2}$/;
          if (monthRegex.test(rowMonth.trim())) {
            targetMonth = rowMonth.trim();
          } else {
            errors.push(`Linha ${csvData.indexOf(row) + 2}: Formato de mês inválido "${rowMonth}". Use YYYY-MM (ex: 2024-01). Usando mês do formulário.`);
          }
        }
        
        const resultsKey = `results_${targetMonth}`;
        
        try {
          await updateStoreAPI(store.id, { 
            [resultsKey]: results
          });
          successCount++;
        } catch (error) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Erro ao atualizar loja "${codigoLoja}": ${error.message || 'Erro desconhecido'}`);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setTimeout(() => {
          fetchData();
        }, 500);
        
        toast({ 
          title: 'Upload concluído!', 
          description: `${successCount} loja(s) atualizada(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s) encontrado(s).` : ''}`,
        });
      }
      
      if (errors.length > 0) {
        console.error('Erros no upload:', errors);
        if (errors.length <= 10) {
          toast({
            title: 'Erros encontrados',
            description: errors.join('; '),
            variant: 'destructive',
            duration: 10000
          });
        } else {
          toast({
            title: 'Muitos erros',
            description: `${errors.length} erros encontrados. Verifique o console para detalhes.`,
            variant: 'destructive',
            duration: 10000
          });
        }
      }
      
      if (resultsFileInputRef.current) {
        resultsFileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({ 
        title: 'Erro ao processar CSV', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploadingResults(false);
    }
  };

  const handleDeleteStore = (store) => {
    if (window.confirm(`Tem certeza que deseja excluir a loja ${store.name}?`)) {
      deleteStore(store.id);
      toast({ title: "Loja excluída!", description: `${store.name} foi removida.`, variant: 'destructive' });
    }
  };
  
  const handleDeleteEvaluation = async (evalId) => {
     if (window.confirm(`Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.`)) {
      await deleteEvaluation(evalId);
      // Toast já é exibido pela função deleteEvaluation
    }
  }

  const handleApproveEvaluation = async (evalId) => {
    try {
      await approveEvaluation(evalId);
      // Toast já é exibido pela função approveEvaluation
      // Fechar modal de pendentes se estiver aberto
      if (modalState.type === 'pendingEvaluations') {
        setModalState({ type: null, data: null });
      }
    } catch (error) {
      // Error já é tratado pela função approveEvaluation
    }
  }

  const handleViewEvaluationDetail = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setModalState({ type: 'evaluationDetail', data: null });
  }

  const getBrandClass = (bandeira) => {
    if (bandeira === 'ARTWALK') return 'border-artwalk';
    if (bandeira === 'AUTHENTIC FEET') return 'border-authentic-feet';
    if (bandeira === 'MAGICFEET') return 'border-magic-feet';
    return 'border-border';
  }

  return (
    <>
      <Helmet><title>Gerenciamento de Lojas - MYFEET</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciamento de Lojas</h1>
            <p className="text-muted-foreground mt-1">Gerencie lojas e suas avaliações.</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={franqueadoFilter} onValueChange={setFranqueadoFilter}>
              <SelectTrigger className="w-48 bg-card border-border">
                <SelectValue placeholder="Filtrar por Franquia" />
              </SelectTrigger>
              <SelectContent>
                {franqueados.map(f => (
                  <SelectItem key={f} value={f}>
                    {f === 'all' ? 'Todas as Franquias' : f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código ou nome..." className="pl-9 w-64 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {canManageStores && (
              <>
                <div className="space-y-1">
                  <Label htmlFor="resultsCSVMonth" className="text-xs text-muted-foreground">Mês padrão CSV</Label>
                  <Input
                    id="resultsCSVMonth"
                    type="month"
                    value={resultMonthCSV}
                    onChange={(e) => setResultMonthCSV(e.target.value)}
                    min="2020-01"
                    className="w-36 bg-secondary h-9 text-sm"
                    title="Mês que será usado quando a coluna mes_ano estiver vazia no CSV"
                  />
                </div>
                <Button 
                  type="button" 
                  onClick={generateResultsCSVTemplate} 
                  variant="outline" 
                  className="gap-2"
                  title="Baixar template CSV para importação de resultados em massa"
                >
                  <Download className="w-4 h-4" /> Template Resultados
                </Button>
                <Button 
                  type="button" 
                  onClick={() => resultsFileInputRef.current?.click()} 
                  variant="outline" 
                  className="gap-2"
                  disabled={isUploadingResults}
                  title="Fazer upload de CSV com múltiplos resultados"
                >
                  <Upload className="w-4 h-4" /> {isUploadingResults ? 'Processando...' : 'Importar Resultados'}
                </Button>
                <input
                  ref={resultsFileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCSVUploadResults}
                  style={{ display: 'none' }}
                />
                <Button onClick={() => setModalState({ type: 'editStore', data: null })} className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90">
                  <Plus className="w-4 h-4" /> Nova Loja
                </Button>
              </>
            )}
          </div>
        </div>

        <PerformanceCarousel stores={filteredStores} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStores.map((store, index) => (
            <motion.div
              key={store.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}
              className={cn("bg-card rounded-xl shadow-lg border-l-4 p-5 flex flex-col justify-between", getBrandClass(store.bandeira))}
            >
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                      <h3 className="font-semibold text-foreground">{store.name}</h3>
                      <p className="text-sm text-muted-foreground">{store.code}</p>
                  </div>
                  <div className="flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setModalState({ type: 'editStore', data: store })}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate(`/goals?storeId=${store.id}`)}><Target className="mr-2 h-4 w-4" /> Definir Metas</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setModalState({ type: 'viewEvaluations', data: store })}><Eye className="mr-2 h-4 w-4" /> Ver Avaliações</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setModalState({ type: 'headcount', data: store })}><Users className="mr-2 h-4 w-4" /> Headcount</DropdownMenuItem>
                        {isAdmin && <DropdownMenuItem onClick={() => handleDeleteStore(store)} className="text-destructive focus:text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                {pendingEvaluationsByStore[store.id] > 0 && (user.role === 'admin' || user.role === 'supervisor' || user.role === 'comunicação') && (
                  <div className="mb-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full bg-yellow-500/10 border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/20"
                      onClick={() => setModalState({ type: 'pendingEvaluations', data: store })}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      {pendingEvaluationsByStore[store.id]} Avaliação{pendingEvaluationsByStore[store.id] > 1 ? 'ões' : ''} Pendente{pendingEvaluationsByStore[store.id] > 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {[
                    { label: 'Supervisor', value: store.supervisor },
                    { label: 'Franqueado', value: store.franqueado },
                    { label: 'Estado', value: store.estado },
                  ].map(item => (
                    <div key={item.label} className="flex justify-between"><span className="text-muted-foreground">{item.label}:</span><span className="font-medium text-foreground text-right truncate">{item.value}</span></div>
                  ))}
                </div>
                 <StoreGoalThermometer store={store} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <Dialog open={!!modalState.type} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setModalState({ type: null, data: null });
          setSelectedEvaluation(null);
        }
      }}>
        {modalState.type === 'editStore' && <StoreFormModal store={modalState.data} onSave={handleSaveStore} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} />}
        {modalState.type === 'viewEvaluations' && <ViewEvaluationsModal store={modalState.data} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} onDelete={handleDeleteEvaluation} onApprove={handleApproveEvaluation} onViewDetail={handleViewEvaluationDetail} />}
        {modalState.type === 'pendingEvaluations' && <PendingEvaluationsModal store={modalState.data} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} onDelete={handleDeleteEvaluation} onApprove={handleApproveEvaluation} onViewDetail={handleViewEvaluationDetail} />}
        {modalState.type === 'evaluationDetail' && selectedEvaluation && (
          <EvaluationDetailModal 
            evaluation={selectedEvaluation} 
            form={forms?.find(f => f.id === selectedEvaluation.formId)} 
            onOpenChange={(isOpen) => {
              if (!isOpen) {
                setModalState({ type: null, data: null });
                setSelectedEvaluation(null);
              }
            }}
            users={users}
          />
        )}
        {modalState.type === 'headcount' && <HeadcountModal store={modalState.data} collaborators={collaborators} jobRoles={jobRoles} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} />}
      </Dialog>
    </>
  );
};

export default StoresManagement;