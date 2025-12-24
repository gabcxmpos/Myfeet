import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, Settings, UserPlus, Eye, Menu, AlertCircle, Sun, Moon } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import AlertsModal from '@/components/AlertsModal';
import { fetchUnreadAlerts } from '@/lib/supabaseService';
import { cn } from '@/lib/utils';

const Header = ({ onToggleSidebar, isSidebarOpen, isDesktop }) => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';
  const isStore = user?.role === 'loja' || user?.role === 'loja_franquia' || user?.role === 'admin_loja';
  const [unreadAlertsCount, setUnreadAlertsCount] = useState(0);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);

  useEffect(() => {
    if (isStore && user?.storeId) {
      loadUnreadAlerts();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadUnreadAlerts, 30000);
      return () => clearInterval(interval);
    }
  }, [isStore, user?.storeId]);

  const loadUnreadAlerts = async () => {
    if (!user?.storeId) return;
    try {
      const alerts = await fetchUnreadAlerts(user.storeId);
      setUnreadAlertsCount(alerts?.length || 0);
    } catch (error) {
      console.error('Erro ao carregar alertas não lidos:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.warn('Erro ao fazer logout:', error);
      // Continuar mesmo com erro para garantir logout local
    } finally {
      // Sempre redirecionar para login, mesmo se houver erro
      navigate('/login');
    }
  };

  const handleToggleSidebar = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 [Header] handleToggleSidebar chamado. isDesktop:', isDesktop, 'isSidebarOpen:', isSidebarOpen);
    }
    if (onToggleSidebar) {
      onToggleSidebar();
    } else {
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [Header] onToggleSidebar não está definido!');
      }
    }
  };

  return (
    <header className="bg-card border-b border-border px-4 sm:px-6 py-3 flex items-center justify-between relative z-[55] w-full" style={{ zIndex: 55 }}>
      <div className="flex items-center gap-3">
        {/* Botão de toggle da sidebar - sempre visível e com z-index alto, especialmente em mobile */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
          onTouchStart={handleToggleSidebar}
          aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          className="cursor-pointer z-50 relative flex items-center justify-center"
          style={{ zIndex: 50, minWidth: '2.5rem', minHeight: '2.5rem' }}
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
        {/* Botão de Toggle de Tema */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          className="relative"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </Button>

        {isStore && (
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsAlertsModalOpen(true)}
            className="relative"
            title="Alertas e Comunicados"
          >
            <AlertCircle className={cn(
              "w-5 h-5",
              unreadAlertsCount > 0 ? "text-primary" : "text-muted-foreground"
            )} />
            {unreadAlertsCount > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadAlertsCount > 9 ? '9+' : unreadAlertsCount}
              </Badge>
            )}
          </Button>
        )}
        
        {!isStore && (
          <Button variant="ghost" size="icon">
            <Bell className="w-5 h-5 text-muted-foreground" />
          </Button>
        )}

        {isAdmin && (
          <div className="flex items-center gap-1">
            <NavLink to="/users">
              <Button variant="ghost" size="icon" title="Gerenciar Usuários">
                <UserPlus className="w-5 h-5 text-muted-foreground" />
              </Button>
            </NavLink>
            <NavLink to="/settings/visibility">
              <Button variant="ghost" size="icon" title="Visibilidade do Menu">
                <Eye className="w-5 h-5 text-muted-foreground" />
              </Button>
            </NavLink>
            <NavLink to="/settings">
              <Button variant="ghost" size="icon" title="Configurações Gerais">
                <Settings className="w-5 h-5 text-muted-foreground" />
              </Button>
            </NavLink>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="text-sm hidden sm:block">
                  <p className="font-semibold text-foreground">{user?.username}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-400">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isStore && user?.storeId && (
        <AlertsModal
          open={isAlertsModalOpen}
          onOpenChange={(open) => {
            setIsAlertsModalOpen(open);
            if (!open) {
              // Recarregar contagem quando fechar o modal
              loadUnreadAlerts();
            }
          }}
          storeId={user.storeId}
        />
      )}
    </header>
  );
};

export default Header;
