import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Store, Edit, Trash2, Eye, MoreVertical, Search, CheckCircle, Flame, Target, TrendingUp, DollarSign, Percent, Hash, Truck, BarChart as BarChartIcon, Globe, Trophy, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, Users } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
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
        const data = stores.map(store => {
            const goal = store.goals?.[selectedKpi] || 0;
            const result = store.results?.[selectedKpi] || 0;
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

    if (!store || !store.goals || !store.results) return null;

    const goal = store.goals[selectedKpi] || 0;
    const result = store.results[selectedKpi] || 0;
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
    code: '', name: '', bandeira: '', shopping: '', manager: '', supervisor: '', franqueado: '', estado: '', telefone: ''
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
        </div>
        <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">{store ? 'Salvar Alterações' : 'Cadastrar Loja'}</Button>
      </form>
    </DialogContent>
  );
};

const ResultsFormModal = ({ store, onSave, onOpenChange }) => {
    const [results, setResults] = useState(store?.results || {});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setResults(prev => ({...prev, [name]: parseFloat(value) || 0 }));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(store.id, { results });
        onOpenChange(false);
    }
    
    return (
        <DialogContent className="max-w-xl bg-card border-border">
            <DialogHeader>
                <DialogTitle>Lançar Resultados - {store.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="mt-4 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     {resultFields.map(field => (
                        <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name} className="flex items-center gap-2 text-muted-foreground">
                                <field.icon className="w-4 h-4" />{field.label}
                            </Label>
                            <Input 
                                id={field.name} 
                                name={field.name} 
                                type="number" 
                                step="any" 
                                value={results[field.name] || ''} 
                                onChange={handleChange} 
                                placeholder={field.placeholder}
                                className="bg-secondary"
                            />
                        </div>
                    ))}
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary/90">Salvar Resultados</Button>
            </form>
        </DialogContent>
    );
};


const ViewEvaluationsModal = ({ store, onOpenChange, onDelete, onApprove }) => {
  const { evaluations } = useData();
  const { user } = useAuth();
  const storeEvaluations = evaluations.filter(ev => ev.storeId === store.id).sort((a,b) => new Date(b.date) - new Date(a.date));

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle>Avaliações de {store.name}</DialogTitle>
      </DialogHeader>
      <div className="mt-4 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
        {storeEvaluations.length > 0 ? storeEvaluations.map(ev => (
          <div key={ev.id} className="bg-secondary p-3 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-semibold">{ev.pillar} - <span className="text-primary">{ev.score} pts</span></p>
              <p className="text-xs text-muted-foreground">
                {new Date(ev.date).toLocaleDateString()} - 
                <span className={cn("ml-1 font-bold", ev.status === 'pending' ? 'text-yellow-500' : 'text-green-500')}>
                  {ev.status === 'pending' ? 'Pendente' : 'Aprovada'}
                </span>
              </p>
            </div>
            <div className="flex gap-2">
              {(user.role === 'admin' || user.role === 'supervisor') && ev.status === 'pending' && (
                <Button variant="ghost" size="icon" onClick={() => onApprove(ev.id)}><CheckCircle className="w-5 h-5 text-green-500 hover:text-green-400" /></Button>
              )}
              {user.role === 'admin' && (
                <Button variant="ghost" size="icon" onClick={() => onDelete(ev.id)}><Trash2 className="w-5 h-5 text-destructive hover:text-red-400" /></Button>
              )}
            </div>
          </div>
        )) : <p className="text-muted-foreground text-center py-4">Nenhuma avaliação encontrada para esta loja.</p>}
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
    
    // Inicializar todos os cargos com 0
    if (jobRoles && jobRoles.length > 0) {
      jobRoles.forEach(role => {
        grouped[role] = [];
      });
    }
    
    // Agrupar colaboradores ativos por cargo
    activeCollaborators.forEach(collab => {
      const role = collab.role || 'Sem cargo';
      if (!grouped[role]) {
        grouped[role] = [];
      }
      grouped[role].push(collab);
    });
    
    return grouped;
  }, [storeCollaborators, jobRoles]);

  const totalCollaborators = activeCollaborators.length;

  return (
    <DialogContent className="max-w-3xl bg-card border-border">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Headcount - {store?.name}
        </DialogTitle>
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
            jobRoles.map(role => {
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
            })
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
  const { stores, addStore, updateStore, deleteStore, deleteEvaluation, approveEvaluation, fetchData, collaborators, jobRoles } = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({ type: null, data: null });
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      store.code.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [stores, searchTerm]);

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

  const handleSaveResults = (storeId, resultsData) => {
    updateStore(storeId, resultsData);
    toast({ title: "Resultados salvos!", description: "Os resultados da loja foram atualizados." });
    setModalState({ type: null, data: null });
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
    } catch (error) {
      // Error já é tratado pela função approveEvaluation
    }
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código ou nome..." className="pl-9 w-64 bg-card" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            {isAdmin && (
              <Button onClick={() => setModalState({ type: 'editStore', data: null })} className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90">
                <Plus className="w-4 h-4" /> Nova Loja
              </Button>
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
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setModalState({ type: 'editResults', data: store })}>
                        <TrendingUp className="w-4 h-4 text-muted-foreground hover:text-primary" />
                    </Button>
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

      <Dialog open={!!modalState.type} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })}>
        {modalState.type === 'editStore' && <StoreFormModal store={modalState.data} onSave={handleSaveStore} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} />}
        {modalState.type === 'viewEvaluations' && <ViewEvaluationsModal store={modalState.data} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} onDelete={handleDeleteEvaluation} onApprove={handleApproveEvaluation} />}
        {modalState.type === 'editResults' && <ResultsFormModal store={modalState.data} onSave={handleSaveResults} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} />}
        {modalState.type === 'headcount' && <HeadcountModal store={modalState.data} collaborators={collaborators} jobRoles={jobRoles} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })} />}
      </Dialog>
    </>
  );
};

export default StoresManagement;
