import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { loading: authLoading } = useAuth();
  // Estado da sidebar: null = fechada em mobile por padrão, true/false = preferência do usuário
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => {
    // Carregar preferência do localStorage
    const saved = localStorage.getItem('sidebarOpen');
    if (saved !== null) return saved === 'true';
    // Em mobile, começar fechada; em desktop, começar aberta
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024; // lg breakpoint
    }
    return true;
  });

  // Estado para sidebar minimizada/maximizada (apenas desktop)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    if (saved !== null) return saved === 'true';
    return false; // Começar maximizada
  });

  // Salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  // Ajustar estado da sidebar quando redimensionar
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      // Em desktop, manter aberta por padrão se não houver preferência salva
      if (isDesktop && localStorage.getItem('sidebarOpen') === null) {
        setIsSidebarOpen(true);
      }
      // Em mobile, fechar automaticamente se estiver aberta
      if (!isDesktop && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const closeSidebar = () => {
    // Em mobile, fechar ao clicar no overlay ou ao navegar
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false);
    }
  };

  if (authLoading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // Determinar se estamos em desktop
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;

  return (
    <div className="flex h-screen bg-background text-foreground relative">
      {/* Overlay para mobile quando sidebar está aberta */}
      {isSidebarOpen && !isDesktop && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={closeSidebar}
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? (isDesktop && isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[256px]') : 'lg:ml-0'}`}>
        <Header onToggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <Outlet />
        </main>
        <footer className="bg-card border-t border-border py-4 px-6 text-center text-xs text-muted-foreground">
            MYFEET Painel PPAD — © {new Date().getFullYear()} Grupo Afeet
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
