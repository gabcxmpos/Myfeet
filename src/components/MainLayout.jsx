import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { loading: authLoading } = useAuth();
  
  // Estado para detectar se é desktop de forma reativa
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
  });

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

  // Atualizar isDesktop quando redimensionar
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);
      
      // Em desktop, manter aberta por padrão se não houver preferência salva
      if (desktop && localStorage.getItem('sidebarOpen') === null) {
        setIsSidebarOpen(true);
      }
      // Em mobile, fechar automaticamente se estiver aberta
      if (!desktop && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Verificar tamanho inicial
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Salvar preferência no localStorage
  useEffect(() => {
    localStorage.setItem('sidebarOpen', String(isSidebarOpen));
  }, [isSidebarOpen]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const closeSidebar = () => {
    // Em mobile, sempre fechar
    if (!isDesktop) {
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

  return (
    <div className="flex h-screen bg-background text-foreground relative overflow-hidden">
      {/* Overlay para mobile quando sidebar está aberta */}
      {isSidebarOpen && !isDesktop && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/50 z-40"
          onClick={(e) => {
            // Só fechar se clicar diretamente no overlay (não em elementos filhos)
            // A sidebar está em z-50, então cliques nela não chegam aqui
            if (e.target === e.currentTarget) {
              closeSidebar();
            }
          }}
          aria-hidden="true"
        />
      )}
      
      {/* Sidebar */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={closeSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isDesktop={isDesktop}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen && isDesktop ? (isSidebarCollapsed ? 'lg:ml-[80px]' : 'lg:ml-[256px]') : 'lg:ml-0'}`}>
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