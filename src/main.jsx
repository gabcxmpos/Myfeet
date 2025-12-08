import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from "@/components/ui/toaster";
import App from '@/App';
import '@/index.css';

// Tratamento de erros global para debug
if (import.meta.env.DEV) {
  window.addEventListener('error', (event) => {
    console.error('❌ Erro global capturado:', event.error);
  });

  window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ Promise rejeitada não tratada:', event.reason);
  });
}

// Verificar se o elemento root existe
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Elemento #root não encontrado no DOM!');
  document.body.innerHTML = '<div style="padding: 20px; color: red; font-family: Arial;">Erro: Elemento #root não encontrado. Verifique o arquivo index.html.</div>';
} else {
  try {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
    console.log('✅ Aplicação React renderizada com sucesso');
  } catch (error) {
    console.error('❌ Erro ao renderizar aplicação:', error);
    rootElement.innerHTML = `<div style="padding: 20px; color: red; font-family: Arial;">Erro ao renderizar: ${error.message}<br><pre>${error.stack}</pre></div>`;
  }
}
