import React from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Trophy, Medal, Award, BarChart3, LineChart, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, ListChecks, ClipboardList, Wrench, GraduationCap, RotateCcw, FileCheck, Calendar, AlertCircle, TrendingUp, Calculator, XCircle, Package, AlertTriangle, Bell } from 'lucide-react';

const allMenuItems = [
    // Dashboard e Ranking primeiro
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'financeiro', 'digital'] },
    { path: '/ranking', icon: Medal, label: 'Ranking PPAD', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'financeiro', 'digital'] },
    { path: '/painel-excelencia', icon: Award, label: 'Painel Excelência', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    // Checklists logo após Painel Excelência (para admin)
    { path: '/checklists', icon: ListChecks, label: 'Checklists', roles: ['admin', 'devoluções', 'motorista', 'comunicação', 'digital'] },
    { path: '/manage-checklists', icon: Wrench, label: 'Gerenciar Checklists', roles: ['admin'] },
    // Seção Análises (página principal com subpáginas)
    { path: '/analises', icon: BarChart3, label: 'Análises', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro', 'digital'] },
    // Demais itens
    { path: '/chave', icon: KeyRound, label: 'CHAVE', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'financeiro', 'digital'] },
    { path: '/checklist', icon: FileCheck, label: 'Checklist Diário', roles: ['supervisor', 'supervisor_franquia', 'digital'] },
    { path: '/store-checklists', icon: ClipboardList, label: 'Checklists', roles: ['loja', 'loja_franquia'] },
    { path: '/non-conversion-report', icon: XCircle, label: 'Relatório de Não Conversão', roles: ['loja', 'loja_franquia'] },
    // Gestão e Metas (página principal com subpáginas)
    { path: '/gestao-metas', icon: LineChart, label: 'Gestão e Metas', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro'] },
    { path: '/evaluation', icon: ClipboardCheck, label: 'Nova Avaliação', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'comunicação', 'digital'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/store-results', icon: TrendingUp, label: 'Resultados da Loja', roles: ['loja', 'loja_franquia'] },
    { path: '/patrimony', icon: Package, label: 'Controle de Patrimônio', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/store-patrimony', icon: Package, label: 'Patrimônio', roles: ['loja', 'loja_franquia'] },
    { path: '/physical-missing', icon: AlertTriangle, label: 'Falta Física', roles: ['loja', 'loja_franquia'] },
    { path: '/stores-cto', icon: Calculator, label: 'CTO', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro'] },
    { path: '/acionamentos', icon: AlertCircle, label: 'Acionamentos', roles: ['comunicação'] },
    { path: '/alertas-comunicados', icon: Bell, label: 'Alertas e Comunicados', roles: ['admin', 'comunicação'] },
    { path: '/forms', icon: FileText, label: 'Criar Formulário', roles: ['admin'] },
    { path: '/collaborators', icon: Users2, label: 'Colaboradores', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback', icon: MessageSquareQuote, label: 'Dar Feedback', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback-management', icon: BookUser, label: 'Gestão de Feedbacks', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/training-management', icon: GraduationCap, label: 'Agenda de Treinamentos', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/training', icon: GraduationCap, label: 'Treinamentos', roles: ['loja', 'loja_franquia'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja', 'devoluções', 'financeiro'] },
    { path: '/returns-planner', icon: Calendar, label: 'Planner de Devoluções', roles: ['devoluções'] },
];

const HomePage = () => {
    const { user } = useAuth();
    const { menuVisibility } = useData();
    const navigate = useNavigate();

    // Filtrar itens do menu baseado no role do usuário e visibilidade
    const menuItems = allMenuItems.filter(item => {
        // Verificar se o usuário tem permissão para o item
        if (!user?.role || !item.roles.includes(user.role)) {
            return false;
        }
        // Verificar configurações de visibilidade
        const visibilitySettings = menuVisibility[item.path];
        if (visibilitySettings && visibilitySettings[user.role] === false) {
            return false;
        }
        return true;
    });

    const handleNavigate = (path) => {
        navigate(path);
    };

    return (
        <>
            <Helmet>
                <title>Início - MYFEET</title>
            </Helmet>
            <div className="space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        MYFEET
                    </h1>
                    <p className="text-muted-foreground">Painel PPAD - Selecione uma opção</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {menuItems.map((item, index) => {
                        const Icon = item.icon;
                        return (
                            <motion.div
                                key={item.path}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <Card 
                                    className="cursor-pointer hover:shadow-lg transition-all hover:scale-105 h-full"
                                    onClick={() => handleNavigate(item.path)}
                                >
                                    <CardContent className="flex flex-col items-center justify-center p-6 space-y-3 min-h-[120px]">
                                        <div className="p-3 rounded-lg bg-primary/10">
                                            <Icon className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="text-sm font-medium text-center line-clamp-2">
                                            {item.label}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>

                {menuItems.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Nenhum item disponível no momento.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default HomePage;
