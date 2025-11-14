import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { LayoutDashboard, Trophy, BarChart3, ClipboardCheck, Store, FileText, Target, Users2, MessageSquare as MessageSquareQuote, BookUser, KeyRound, CheckSquare } from 'lucide-react';

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
];

const Sidebar = () => {
  const { user } = useAuth();
  const { menuVisibility } = useData();

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

  return (
    <motion.aside 
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-card border-r border-border flex flex-col"
    >
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
          MYFEET
        </h1>
        <p className="text-xs text-muted-foreground mt-1">Painel PPAD</p>
      </div>
      
      <nav className="flex-1 overflow-y-auto py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-6 py-3 text-sm font-medium transition-all relative ${
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <motion.div layoutId="active-menu" className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />}
                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
