import React from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User, Bell, Settings, UserPlus, Eye, Menu } from 'lucide-react';
import { useNavigate, NavLink } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Header = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

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

  const handleToggleSidebar = () => {
    if (onToggleSidebar) {
      onToggleSidebar();
    }
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Botão de toggle da sidebar - sempre visível */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleSidebar}
          aria-label={isSidebarOpen ? 'Fechar menu' : 'Abrir menu'}
          className="cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </Button>
      </div>
      
      <div className="flex items-center gap-4 ml-auto">
         <Button variant="ghost" size="icon">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </Button>

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
    </header>
  );
};

export default Header;
