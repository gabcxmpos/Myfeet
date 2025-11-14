import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

const MainLayout = () => {
  const { loading: authLoading } = useAuth();

  if (authLoading) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
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
