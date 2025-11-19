import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { LayoutDashboard, Trophy, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare, GraduationCap, RotateCcw, X, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    { path: '/training', icon: GraduationCap, label: 'Treinamentos', roles: ['loja'] },
    { path: '/returns', icon: RotateCcw, label: 'Devoluções', roles: ['admin', 'supervisor', 'loja'] },
];

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
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

  // Estado para detectar se é desktop
  const [isDesktop, setIsDesktop] = React.useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

  // Atualizar quando redimensionar
  React.useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fechar sidebar ao navegar em mobile
  React.useEffect(() => {
    if (!isDesktop && isOpen) {
      onClose();
    }
  }, [location.pathname, isDesktop, isOpen, onClose]);

  // Mostrar sidebar se estiver aberta (tanto em desktop quanto mobile)
  // Em desktop, pode estar aberta mas minimizada
  if (!isOpen) return null;

  return (
    <motion.aside
      initial={!isDesktop ? { x: -300, opacity: 0 } : { opacity: 0 }}
      animate={{ 
        x: 0, 
        opacity: 1,
        width: isDesktop && isCollapsed ? 80 : 256
      }}
      exit={!isDesktop ? { x: -300, opacity: 0 } : { opacity: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className={`${
        isDesktop 
          ? 'fixed z-40' 
          : 'fixed z-50'
      } inset-y-0 left-0 bg-card border-r border-border flex flex-col shadow-lg lg:shadow-none overflow-hidden`}
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
                onClick={onClose} // Fechar ao clicar em mobile
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
  );
};

export default Sidebar;
