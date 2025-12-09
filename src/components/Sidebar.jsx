import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { LayoutDashboard, Trophy, Award, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, CheckSquare, GraduationCap, RotateCcw, X, Menu, FileCheck, Calendar, Route, Settings, MessageCircle, AlertCircle, TrendingUp, FileBarChart, Calculator, FileSpreadsheet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';

const allMenuItems = [
    // Dashboard e Ranking primeiro
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'admin_loja', 'comunicação', 'digital'] },
    { path: '/ranking', icon: Trophy, label: 'Ranking PPAD', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'admin_loja', 'digital'] },
    { path: '/painel-excelencia', icon: Award, label: 'Painel Excelência', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/digital-evaluations', icon: Smartphone, label: 'Avaliações Digital', roles: ['digital', 'admin', 'supervisor', 'supervisor_franquia'] },
    // Demais itens
    { path: '/checklist', icon: CheckSquare, label: 'Checklist Diário', roles: ['supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'admin_loja'] },
    { path: '/checklist-audit-analytics', icon: FileCheck, label: 'Análise de Auditorias', roles: ['admin'] },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/goals', icon: Target, label: 'Definir Metas', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/results-management', icon: FileBarChart, label: 'Gestão de Resultados', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/evaluation', icon: ClipboardCheck, label: 'Nova Avaliação', roles: ['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'admin_loja', 'comunicação', 'digital'] },
    { path: '/stores', icon: Store, label: 'Lojas', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação'] },
    { path: '/stores-cto', icon: Calculator, label: 'Lojas para CTO', roles: ['admin', 'financeiro'] },
    { path: '/stores-cto-register', icon: FileSpreadsheet, label: 'Livro Registro CTO', roles: ['admin', 'financeiro'] },
    { path: '/acionamentos', icon: AlertCircle, label: 'Acionamentos', roles: ['comunicação'] },
    { path: '/alertas-comunicados', icon: MessageCircle, label: 'Alertas e Comunicados', roles: ['comunicação'] },
    { path: '/forms', icon: FileText, label: 'Criar Formulário', roles: ['admin'] },
    { path: '/collaborators', icon: Users2, label: 'Colaboradores', roles: ['loja', 'loja_franquia', 'admin_loja'] },
    { path: '/store-results', icon: TrendingUp, label: 'Resultados', roles: ['loja', 'loja_franquia', 'admin_loja'] },
    { path: '/feedback', icon: MessageSquareQuote, label: 'Dar Feedback', roles: ['loja', 'loja_franquia', 'admin_loja'] },
    { path: '/feedback-management', icon: BookUser, label: 'Gestão de Feedbacks', roles: ['admin', 'supervisor'] },
    { path: '/training-management', icon: GraduationCap, label: 'Agenda de Treinamentos', roles: ['admin', 'supervisor', 'comunicação'] },
    { path: '/training', icon: GraduationCap, label: 'Treinamentos', roles: ['loja', 'admin_loja'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja', 'admin_loja', 'devoluções'] }, // SEM loja_franquia e supervisor_franquia
    // Planner de Devoluções ainda aparece separado para perfil devoluções (não admin)
    { path: '/returns-planner', icon: Calendar, label: 'Planner de Devoluções', roles: ['devoluções'] },
    // Checklists Consolidados (inclui Checklist Diário para admin)
    { path: '/checklists', icon: CheckSquare, label: 'Checklists', roles: ['admin', 'devoluções', 'motorista', 'comunicação'] },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, isDesktop: isDesktopProp }) => {
  const { user } = useAuth();
  const { menuVisibility } = useData();
  const location = useLocation();

  const menuItems = allMenuItems.filter(item => {
    // Check if user has the role for the item
    if (!user?.role || !item.roles.includes(user.role)) {
      return false;
    }
    // Check visibility settings
    const visibilitySettings = menuVisibility[item.path];
    if (visibilitySettings && visibilitySettings[user.role] === false) {
      return false;
    }
    return true;
  });

  // Usar isDesktop do prop se fornecido, senão detectar localmente
  const [isDesktopLocal, setIsDesktopLocal] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

  const isDesktop = isDesktopProp !== undefined ? isDesktopProp : isDesktopLocal;

  // Atualizar quando redimensionar (apenas se não receber prop)
  React.useEffect(() => {
    if (isDesktopProp !== undefined) return; // Não atualizar se receber prop
    
    const handleResize = () => {
      setIsDesktopLocal(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isDesktopProp]);

  // Fechar sidebar ao navegar em mobile (apenas quando pathname realmente mudar)
  React.useEffect(() => {
    if (!isDesktop && isOpen && onClose) {
      // Usar requestAnimationFrame para garantir que a navegação aconteça antes de fechar
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          onClose();
        });
      });
    }
  }, [location.pathname, isDesktop, isOpen, onClose]);

  // Usar AnimatePresence para animar entrada/saída
  if (process.env.NODE_ENV === 'development') {
    console.log('🎯 [Sidebar] Renderizando. isOpen:', isOpen, 'isDesktop:', isDesktop);
  }
  
  // Se não estiver aberta, não renderizar nada
  if (!isOpen) {
    return null;
  }
  
  return (
    <AnimatePresence>
      <motion.aside
        initial={!isDesktop ? { x: '-100%', opacity: 0 } : { opacity: 0 }}
        animate={{ 
          x: 0, 
          opacity: 1,
          width: isDesktop && isCollapsed ? 80 : 256
        }}
        exit={!isDesktop ? { x: '-100%', opacity: 0 } : { opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className={`${
          isDesktop 
            ? 'fixed z-40' 
            : 'fixed z-[60]'
        } inset-y-0 left-0 bg-card border-r border-border flex flex-col shadow-2xl lg:shadow-none overflow-hidden`}
        style={{ 
          pointerEvents: 'auto',
          width: !isDesktop ? '280px' : (isCollapsed ? '80px' : '256px'),
          maxWidth: !isDesktop ? '85vw' : undefined,
          zIndex: !isDesktop ? 60 : 40
        }}
      >
          {/* Header com botão de fechar em mobile e toggle de minimizar em desktop */}
          <div className={`border-b border-border flex items-center justify-between ${isCollapsed && isDesktop ? 'p-4 justify-center' : 'p-6'}`}>
            {!isCollapsed || !isDesktop ? (
              <div className="flex-1">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  MYFEET
                </h1>
                <p className="text-xs text-muted-foreground mt-1">Painel PPAD</p>
              </div>
            ) : (
              <div className="w-full flex justify-center">
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                  MF
                </h1>
              </div>
            )}
            <div className="flex items-center gap-2">
              {/* Botão de minimizar/maximizar - apenas em desktop */}
              {isDesktop && onToggleCollapse && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  aria-label={isCollapsed ? 'Expandir menu' : 'Minimizar menu'}
                  className="hidden lg:flex"
                >
                  {isCollapsed ? (
                    <Menu className="w-5 h-5" />
                  ) : (
                    <X className="w-5 h-5" />
                  )}
                </Button>
              )}
              {/* Botão de fechar - apenas em mobile */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={onClose}
                aria-label="Fechar menu"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          {/* Menu de navegação */}
          <nav className="flex-1 overflow-y-auto py-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 py-3 text-sm font-medium transition-all relative ${
                    isCollapsed && isDesktop 
                      ? 'px-4 justify-center' 
                      : 'px-6'
                  } ${
                    isActive
                      ? 'text-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`
                }
                title={isCollapsed && isDesktop ? item.label : undefined}
              >
                {({ isActive }) => (
                  <>
                    {isActive && !isCollapsed && (
                      <motion.div layoutId="active-menu" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                    )}
                    {isActive && isCollapsed && isDesktop && (
                      <motion.div 
                        layoutId="active-menu-mobile" 
                        className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" 
                      />
                    )}
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : ''}`} />
                    {(!isCollapsed || !isDesktop) && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </motion.aside>
    </AnimatePresence>
  );
};

export default Sidebar;
