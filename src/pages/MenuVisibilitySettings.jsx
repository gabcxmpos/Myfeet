import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Trophy, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, Eye, GraduationCap, RotateCcw } from 'lucide-react';

const allMenuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'loja'] },
    { path: '/ranking', icon: Trophy, label: 'Ranking PPAD', roles: ['admin', 'supervisor', 'loja'] },
    { path: '/chave', icon: KeyRound, label: 'CHAVE', roles: ['admin', 'supervisor', 'loja'] },
    { path: '/checklist', icon: CheckSquare, label: 'Checklist Diário', roles: ['admin', 'supervisor', 'loja'] },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'supervisor'] },
    { path: '/goals', icon: Target, label: 'Definir Metas', roles: ['admin', 'supervisor'] },
    { path: '/evaluation', icon: ClipboardCheck, label: 'Nova Avaliação', roles: ['admin', 'supervisor', 'loja'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['admin', 'supervisor'] },
    { path: '/forms', icon: FileText, label: 'Criar Formulário', roles: ['admin'] },
    { path: '/collaborators', icon: Users2, label: 'Colaboradores', roles: ['loja'] },
    { path: '/feedback', icon: MessageSquareQuote, label: 'Dar Feedback', roles: ['loja'] },
    { path: '/feedback-management', icon: BookUser, label: 'Gestão de Feedbacks', roles: ['admin', 'supervisor'] },
    { path: '/training-management', icon: GraduationCap, label: 'Agenda de Treinamentos', roles: ['admin', 'supervisor'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja', 'devoluções'] },
];

const roles = ['admin', 'supervisor', 'loja', 'devoluções', 'comunicação', 'financeiro', 'rh', 'motorista'];

const MenuVisibilitySettings = () => {
    const { menuVisibility, updateMenuVisibility, fetchData } = useData();
    const { toast } = useToast();
    const [visibility, setVisibility] = useState(menuVisibility || {});
    const [isSaving, setIsSaving] = useState(false);

    // Atualizar estado local quando menuVisibility mudar no contexto
    useEffect(() => {
        if (menuVisibility) {
            setVisibility(menuVisibility);
        }
    }, [menuVisibility]);

    const handleVisibilityChange = (path, role, isVisible) => {
        setVisibility(prev => ({
            ...prev,
            [path]: {
                ...prev[path],
                [role]: isVisible
            }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await updateMenuVisibility(visibility);
            // Recarregar dados para garantir sincronização
            await fetchData();
            toast({ 
                title: "Sucesso!", 
                description: "As configurações de visibilidade do menu foram salvas." 
            });
        } catch (error) {
            console.error('Erro ao salvar visibilidade:', error);
            toast({ 
                title: "Erro", 
                description: "Não foi possível salvar as configurações. Tente novamente.",
                variant: 'destructive'
            });
        } finally {
            setIsSaving(false);
        }
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
                                <div className="grid items-center px-4 py-2 font-semibold text-muted-foreground" style={{ gridTemplateColumns: `200px repeat(${roles.length}, 1fr)` }}>
                                    <div>Menu Item</div>
                                    {roles.map(role => (
                                        <div key={role} className="text-center capitalize">{role}</div>
                                    ))}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {allMenuItems.map((item, index) => {
                                    const Icon = item.icon;
                                    return (
                                        <div 
                                          key={item.path} 
                                          className="grid items-center p-4 rounded-lg bg-secondary/50"
                                          style={{ gridTemplateColumns: `200px repeat(${roles.length}, 1fr)` }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className="w-5 h-5 text-primary" />
                                                <span className="font-medium text-foreground">{item.label}</span>
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
                            </CardContent>
                        </Card>
                         <Button 
                            type="submit" 
                            className="mt-6 w-full max-w-sm mx-auto flex bg-gradient-to-r from-primary to-blue-500 text-primary-foreground"
                            disabled={isSaving}
                        >
                            {isSaving ? 'Salvando...' : 'Salvar Configurações de Visibilidade'}
                        </Button>
                    </form>
                </motion.div>
            </div>
        </>
    );
};

export default MenuVisibilitySettings;
