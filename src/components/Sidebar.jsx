import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { LayoutDashboard, Trophy, Medal, Award, BarChart3, LineChart, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, ListChecks, ClipboardList, Wrench, GraduationCap, RotateCcw, X, Menu, FileCheck, Calendar, Route, Settings, MessageCircle, AlertCircle, TrendingUp, Calculator, XCircle, Package, AlertTriangle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    { path: '/physical-missing', icon: AlertTriangle, label: 'Falta Física', roles: ['loja', 'loja_franquia'] }, // Apenas loja (admin e devoluções têm dentro de Devoluções)
    { path: '/stores-cto', icon: Calculator, label: 'CTO', roles: ['admin', 'supervisor', 'supervisor_franquia', 'financeiro'] },
    { path: '/acionamentos', icon: AlertCircle, label: 'Acionamentos', roles: ['comunicação'] },
    { path: '/alertas-comunicados', icon: Bell, label: 'Alertas e Comunicados', roles: ['admin', 'comunicação'] },
    { path: '/forms', icon: FileText, label: 'Criar Formulário', roles: ['admin'] },
    { path: '/collaborators', icon: Users2, label: 'Colaboradores', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback', icon: MessageSquareQuote, label: 'Dar Feedback', roles: ['loja', 'loja_franquia'] },
    { path: '/feedback-management', icon: BookUser, label: 'Gestão de Feedbacks', roles: ['admin', 'supervisor', 'supervisor_franquia'] },
    { path: '/training-management', icon: GraduationCap, label: 'Agenda de Treinamentos', roles: ['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital'] },
    { path: '/training', icon: GraduationCap, label: 'Treinamentos', roles: ['loja', 'loja_franquia'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja', 'devoluções', 'financeiro'] }, // SEM loja_franquia e supervisor_franquia
    // Planner de Devoluções - perfil devoluções e compras (compras só visualiza)
    { path: '/returns-planner', icon: Calendar, label: 'Planner de Devoluções', roles: ['devoluções', 'compras'] },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse, isDesktop: isDesktopProp }) => {
  const { user } = useAuth();
  const { menuVisibility } = useData();
  const location = useLocation();
  
  // Debug: Log para verificar estados
  if (process.env.NODE_ENV === 'development') {
    React.useEffect(() => {
      console.log('🔍 [Sidebar] Estados:', {
        isDesktop: isDesktopProp,
        isCollapsed,
        shouldShowLabels: !isDesktopProp || (isDesktopProp && !isCollapsed)
      });
    }, [isDesktopProp, isCollapsed]);
  }

  const menuItems = allMenuItems.filter(item => {
    // Check if user has the role for the item
    if (!user?.role || !item.roles.includes(user.role)) {
      if (process.env.NODE_ENV === 'development' && item.path === '/returns') {
        console.log('🔍 [Sidebar] Item /returns filtrado:', {
          userRole: user?.role,
          itemRoles: item.roles,
          hasRole: item.roles.includes(user?.role)
        });
      }
      return false;
    }
    // Check visibility settings
    const visibilitySettings = menuVisibility[item.path];
    if (visibilitySettings && visibilitySettings[user.role] === false) {
      if (process.env.NODE_ENV === 'development' && item.path === '/returns') {
        console.log('🔍 [Sidebar] Item /returns escondido por menuVisibility:', visibilitySettings);
      }
      return false;
    }
    if (process.env.NODE_ENV === 'development' && item.path === '/returns') {
      console.log('✅ [Sidebar] Item /returns incluído no menu para role:', user?.role);
    }
    return true;
  });
  
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 [Sidebar] Menu items filtrados:', {
      userRole: user?.role,
      totalItems: allMenuItems.length,
      filteredItems: menuItems.length,
      returnsIncluded: menuItems.some(item => item.path === '/returns'),
      menuItems: menuItems.map(item => item.path)
    });
  }

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
              {/* Botão de minimizar/maximizar - apenas em desktop e quando expandido */}
              {/* Quando colapsado em desktop, não mostrar botão (Header já tem o Menu) */}
              {isDesktop && onToggleCollapse && !isCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onToggleCollapse}
                  aria-label="Minimizar menu"
                  className="hidden lg:flex"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
              {/* Botão de fechar - apenas em mobile, e apenas quando sidebar está aberta */}
              {!isDesktop && isOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={onClose}
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </Button>
              )}
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
                    {/* Mostrar labels sempre quando não for desktop, ou quando não estiver colapsada em desktop */}
                    {(!isDesktop || !isCollapsed) && <span className="truncate">{item.label}</span>}
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