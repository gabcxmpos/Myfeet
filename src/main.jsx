
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from "@/components/ui/toaster";
import App from '@/App';
import '@/index.css';

// Aplicar tema inicial do localStorage antes de renderizar
const rootElement = document.documentElement;
const savedTheme = localStorage.getItem('theme') || 'dark';
rootElement.classList.remove('light', 'dark');
rootElement.classList.add(savedTheme);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
);
