import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Trophy, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, Eye, Calculator, TrendingUp, AlertCircle, GraduationCap, RotateCcw, Calendar, AlertTriangle } from 'lucide-react';

const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'financeiro', 'digital'] },
    { path: '/ranking', icon: Trophy, label: 'Ranking PPAD', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'financeiro', 'digital'] },
    { path: '/painel-excelencia', icon: Trophy, label: 'Painel Excelência', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/checklists', icon: CheckSquare, label: 'Checklists', roles: ['admin', 'devoluções', 'motorista', 'comunicação', 'digital'] },
    { path: '/analises', icon: BarChart3, label: 'Análises', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro', 'digital'] },
    { path: '/chave', icon: KeyRound, label: 'CHAVE', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'financeiro', 'digital'] },
    { path: '/checklist', icon: CheckSquare, label: 'Checklist Diário', roles: ['supervisor', 'supervisor_franquia', 'digital'] },
    { path: '/store-checklists', icon: CheckSquare, label: 'Checklists', roles: ['loja', 'loja_franquia'] },
    { path: '/gestao-metas', icon: BarChart3, label: 'Gestão e Metas', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro'] },
    { path: '/evaluation', icon: ClipboardCheck, label: 'Nova Avaliação', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'digital'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/store-results', icon: TrendingUp, label: 'Resultados da Loja', roles: ['loja', 'loja_franquia'] },
    { path: '/physical-missing', icon: AlertTriangle, label: 'Falta Física', roles: ['loja', 'loja_franquia'] }, // Apenas loja (admin e devoluções têm dentro de Devoluções)
    { path: '/stores-cto', icon: Calculator, label: 'CTO', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro'] },
    { path: '/acionamentos', icon: AlertCircle, label: 'Acionamentos', roles: ['comunicação'] },
    { path: '/forms', icon: FileText, label: 'Criar Formulário', roles: ['admin'] },
    { path: '/collaborators', icon: Users2, label: 'Colaboradores', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback', icon: MessageSquareQuote, label: 'Dar Feedback', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback-management', icon: BookUser, label: 'Gestão de Feedbacks', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/training-management', icon: GraduationCap, label: 'Agenda de Treinamentos', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/training', icon: GraduationCap, label: 'Treinamentos', roles: ['loja', 'loja_franquia'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja', 'devoluções', 'financeiro'] },
    { path: '/returns-planner', icon: Calendar, label: 'Planner de Devoluções', roles: ['devoluções'] },
];

const roles = ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'financeiro', 'digital', 'devoluções', 'motorista'];

const MenuVisibilitySettings = () => {
    const { menuVisibility, updateMenuVisibility } = useData();
    const { toast } = useToast();
    const [visibility, setVisibility] = useState(menuVisibility);

    const handleVisibilityChange = (path, role, isVisible) => {
        setVisibility(prev => ({
            ...prev,
            [path]: {
                ...prev[path],
                [role]: isVisible
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        updateMenuVisibility(visibility);
        toast({ title: "Sucesso!", description: "As configurações de visibilidade do menu foram salvas." });
    };

    return (
        <>
            <Helmet>
                <title>Visibilidade do Menu - MYFEET</title>
            </Helmet>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3"><Eye/>Visibilidade do Menu</h1>
                    <p className="text-muted-foreground mt-1">Controle quais itens do menu são visíveis para cada perfil de usuário.</p>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <form onSubmit={handleSubmit}>
                        <Card>
                            <CardHeader>
                                <div className="overflow-x-auto">
                                    <div className="grid items-center px-4 py-2 font-semibold text-muted-foreground min-w-[1000px]" style={{ gridTemplateColumns: `200px repeat(${roles.length}, minmax(100px, 1fr))` }}>
                                        <div>Menu Item</div>
                                        {roles.map(role => (
                                            <div key={role} className="text-center capitalize text-xs">
                                                {role === 'supervisor_franquia' ? 'Supervisor Franquia' : 
                                                 role === 'loja_franquia' ? 'Loja Franquia' :
                                                 role === 'comunicação' ? 'Comunicação' :
                                                 role === 'financeiro' ? 'Financeiro' :
                                                 role === 'digital' ? 'Digital' :
                                                 role === 'devoluções' ? 'Devoluções' :
                                                 role === 'motorista' ? 'Motorista' :
                                                 role.charAt(0).toUpperCase() + role.slice(1)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="overflow-x-auto">
                                    {allMenuItems.map((item, index) => {
                                        const Icon = item.icon;
                                        return (
                                            <div 
                                              key={item.path} 
                                              className="grid items-center p-4 rounded-lg bg-secondary/50 min-w-[1000px] mb-2"
                                              style={{ gridTemplateColumns: `200px repeat(${roles.length}, minmax(100px, 1fr))` }}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon className="w-5 h-5 text-primary flex-shrink-0" />
                                                    <span className="font-medium text-foreground text-sm">{item.label}</span>
                                                </div>
                                                {roles.map(role => (
                                                    <div key={role} className="flex justify-center">
                                                        {item.roles.includes(role) ? (
                                                            <Switch
                                                                checked={visibility[item.path]?.[role] ?? true}
                                                                onCheckedChange={(checked) => handleVisibilityChange(item.path, role, checked)}
                                                                aria-label={`Visibilidade de ${item.label} para ${role}`}
                                                            />
                                                        ) : (
                                                            <div className="w-9 h-5 bg-muted rounded-full" title="Não aplicável para este perfil"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                         <Button type="submit" className="mt-6 w-full max-w-sm mx-auto flex bg-gradient-to-r from-primary to-blue-500 text-primary-foreground">
                            Salvar Configurações de Visibilidade
                        </Button>
                    </form>
                </motion.div>
            </div>
        </>
    );
};

export default MenuVisibilitySettings;
