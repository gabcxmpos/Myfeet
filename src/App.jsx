import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Toaster } from '@/components/ui/toaster';
import Login from '@/pages/Login';
import FirstAccess from '@/pages/FirstAccess';
import Dashboard from '@/pages/Dashboard';
import MonthlyRanking from '@/pages/MonthlyRanking';
import Analytics from '@/pages/Analytics';
import GoalsPanel from '@/pages/GoalsPanel';
import StartEvaluation from '@/pages/StartEvaluation';
import StoresManagement from '@/pages/StoresManagement';
import Settings from '@/pages/Settings';
import ProtectedRoute from '@/components/ProtectedRoute';
import MainLayout from '@/components/MainLayout';
import UserManagement from '@/pages/UserManagement';
import FormBuilder from '@/pages/FormBuilder';
import Collaborators from '@/pages/Collaborators';
import Feedback from '@/pages/Feedback';
import FeedbackManagement from '@/pages/FeedbackManagement';
import Chave from '@/pages/Chave';
import DailyChecklist from '@/pages/DailyChecklist';
import MenuVisibilitySettings from '@/pages/MenuVisibilitySettings';
import TrainingManagement from '@/pages/TrainingManagement';
import Training from '@/pages/Training';
import ReturnsManagement from '@/pages/ReturnsManagement';
import ReturnsPlanner from '@/pages/ReturnsPlanner';
import ReturnsConsolidated from '@/pages/ReturnsConsolidated';
import ChecklistAuditAnalytics from '@/pages/ChecklistAuditAnalytics';
import ChecklistsManagement from '@/pages/ChecklistsManagement';
import Acionamentos from '@/pages/Acionamentos';
import PainelExcelencia from '@/pages/PainelExcelencia';
import StoresCTO from '@/pages/StoresCTO';
import StoresCTOAnalytics from '@/pages/StoresCTOAnalytics';
import StoresCTORegister from '@/pages/StoresCTORegister';
import StoreChecklistsPage from '@/pages/StoreChecklistsPage';
import StoreResults from '@/pages/StoreResults';
import NonConversionReport from '@/pages/NonConversionReport';
import AnalisesPage from '@/pages/AnalisesPage';
import ManageChecklists from '@/pages/ManageChecklists';
import GestaoMetasPage from '@/pages/GestaoMetasPage';
import PatrimonyManagement from '@/pages/PatrimonyManagement';
import StorePatrimony from '@/pages/StorePatrimony';
import PhysicalMissing from '@/pages/PhysicalMissing';
import BrandsSettings from '@/pages/BrandsSettings';
import AlertasComunicados from '@/pages/AlertasComunicados';
import HomePage from '@/pages/HomePage';

function App() {
  return (
    <>
      <Helmet>
        <title>MYFEET - Painel PPAD</title>
        <meta name="description" content="Painel de avaliação de desempenho de lojas baseado nos pilares: Pessoas, Performance, Ambientação e Digital." />
      </Helmet>
      <ThemeProvider>
        <AuthProvider>
          <DataProvider>
            <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/first-access" element={<FirstAccess />} />
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/home" replace />} />
                <Route path="home" element={<HomePage />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ranking" element={<MonthlyRanking />} />
                <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><Analytics /></ProtectedRoute>} />
                <Route path="goals" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><GoalsPanel /></ProtectedRoute>} />
                <Route path="evaluation" element={<StartEvaluation />} />
                <Route path="stores" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação']}><StoresManagement /></ProtectedRoute>} />
                <Route path="painel-excelencia" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação']}><PainelExcelencia /></ProtectedRoute>} />
                <Route path="acionamentos" element={<ProtectedRoute allowedRoles={['comunicação']}><Acionamentos /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="forms" element={<ProtectedRoute allowedRoles={['admin']}><FormBuilder /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                <Route path="settings/visibility" element={<ProtectedRoute allowedRoles={['admin']}><MenuVisibilitySettings /></ProtectedRoute>} />
                <Route path="collaborators" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Collaborators /></ProtectedRoute>} />
                <Route path="feedback" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Feedback /></ProtectedRoute>} />
                <Route path="feedback-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><FeedbackManagement /></ProtectedRoute>} />
                <Route path="training-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação']}><TrainingManagement /></ProtectedRoute>} />
                <Route path="training" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Training /></ProtectedRoute>} />
                {/* Devoluções Consolidada (admin, supervisor, supervisor_franquia, loja, devoluções, financeiro) */}
                <Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'loja', 'loja_franquia', 'devoluções', 'financeiro']}><ReturnsConsolidated /></ProtectedRoute>} />
                {/* Rota alternativa para planner (compatibilidade) */}
                <Route path="returns-planner" element={<ProtectedRoute allowedRoles={['devoluções', 'admin']}><ReturnsConsolidated /></ProtectedRoute>} />
                <Route path="chave" element={<Chave />} />
                <Route path="checklist" element={<DailyChecklist />} />
                <Route path="checklist-audit-analytics" element={<ProtectedRoute allowedRoles={['admin']}><ChecklistAuditAnalytics /></ProtectedRoute>} />
                {/* Checklists Consolidados */}
                <Route path="checklists" element={<ProtectedRoute allowedRoles={['admin', 'devoluções', 'motorista', 'comunicação']}><ChecklistsManagement /></ProtectedRoute>} />
                {/* Gerenciar Checklists */}
                <Route path="manage-checklists" element={<ProtectedRoute allowedRoles={['admin']}><ManageChecklists /></ProtectedRoute>} />
                {/* Análises */}
                <Route path="analises" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro', 'digital']}><AnalisesPage /></ProtectedRoute>} />
                {/* Gestão e Metas */}
                <Route path="gestao-metas" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><GestaoMetasPage /></ProtectedRoute>} />
                {/* CTO - Custo Total de Ocupação */}
                <Route path="stores-cto" element={<ProtectedRoute allowedRoles={['admin', 'financeiro', 'supervisor', 'supervisor_franquia']}><StoresCTO /></ProtectedRoute>} />
                <Route path="stores-cto-analytics" element={<ProtectedRoute allowedRoles={['admin', 'financeiro']}><StoresCTOAnalytics /></ProtectedRoute>} />
                <Route path="stores-cto-register" element={<ProtectedRoute allowedRoles={['admin', 'financeiro']}><StoresCTORegister /></ProtectedRoute>} />
                {/* Store Checklists */}
                <Route path="store-checklists" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><StoreChecklistsPage /></ProtectedRoute>} />
                {/* Store Results */}
                <Route path="store-results" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><StoreResults /></ProtectedRoute>} />
                {/* Relatório de Não Conversão */}
                <Route path="non-conversion-report" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><NonConversionReport /></ProtectedRoute>} />
                {/* Controle de Patrimônio */}
                <Route path="patrimony" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><PatrimonyManagement /></ProtectedRoute>} />
                <Route path="store-patrimony" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><StorePatrimony /></ProtectedRoute>} />
                {/* Falta Física */}
                <Route path="physical-missing" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia', 'admin', 'supervisor', 'supervisor_franquia', 'devoluções']}><PhysicalMissing /></ProtectedRoute>} />
                {/* Configurações de Marcas de Devoluções */}
                <Route path="brands-settings" element={<ProtectedRoute allowedRoles={['admin', 'devoluções']}><BrandsSettings /></ProtectedRoute>} />
                {/* Alertas e Comunicados */}
                <Route path="alertas-comunicados" element={<ProtectedRoute allowedRoles={['admin', 'comunicação']}><AlertasComunicados /></ProtectedRoute>} />
              </Route>
            </Routes>
            </Router>
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default App;