import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';
import { DataProvider } from '@/contexts/DataContext';
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
import StoreResults from '@/pages/StoreResults';
import ResultsManagement from '@/pages/ResultsManagement';
import StoresCTO from '@/pages/StoresCTO';
import StoresCTORegister from '@/pages/StoresCTORegister';
import StoresCTOAnalytics from '@/pages/StoresCTOAnalytics';
import AnalisesPage from '@/pages/AnalisesPage';
import GestaoMetasPage from '@/pages/GestaoMetasPage';
import StoreChecklistsPage from '@/pages/StoreChecklistsPage';
import ManageChecklists from '@/pages/ManageChecklists';

function App() {
  return (
    <>
      <Helmet>
        <title>MYFEET - Painel PPAD</title>
        <meta name="description" content="Painel de avaliação de desempenho de lojas baseado nos pilares: Pessoas, Performance, Ambientação e Digital." />
      </Helmet>
      <AuthProvider>
        <DataProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/first-access" element={<FirstAccess />} />
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="ranking" element={<MonthlyRanking />} />
                <Route path="analises" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro', 'digital']}><AnalisesPage /></ProtectedRoute>} />
                <Route path="gestao-metas" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><GestaoMetasPage /></ProtectedRoute>} />
                {/* Rotas antigas mantidas para compatibilidade */}
                <Route path="analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro', 'digital']}><Analytics /></ProtectedRoute>} />
                <Route path="goals" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><GoalsPanel /></ProtectedRoute>} />
                <Route path="evaluation" element={<StartEvaluation />} />
                <Route path="stores" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital']}><StoresManagement /></ProtectedRoute>} />
                <Route path="store-results" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><StoreResults /></ProtectedRoute>} />
                <Route path="results-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><ResultsManagement /></ProtectedRoute>} />
                {/* Rota antiga mantida para compatibilidade */}
                <Route path="stores-cto" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><StoresCTO /></ProtectedRoute>} />
                <Route path="stores-cto-register" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><StoresCTORegister /></ProtectedRoute>} />
                <Route path="stores-cto-analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'financeiro']}><StoresCTOAnalytics /></ProtectedRoute>} />
                <Route path="painel-excelencia" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital']}><PainelExcelencia /></ProtectedRoute>} />
                <Route path="acionamentos" element={<ProtectedRoute allowedRoles={['comunicação']}><Acionamentos /></ProtectedRoute>} />
                <Route path="users" element={<ProtectedRoute allowedRoles={['admin']}><UserManagement /></ProtectedRoute>} />
                <Route path="forms" element={<ProtectedRoute allowedRoles={['admin']}><FormBuilder /></ProtectedRoute>} />
                <Route path="settings" element={<ProtectedRoute allowedRoles={['admin']}><Settings /></ProtectedRoute>} />
                <Route path="settings/visibility" element={<ProtectedRoute allowedRoles={['admin']}><MenuVisibilitySettings /></ProtectedRoute>} />
                <Route path="collaborators" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Collaborators /></ProtectedRoute>} />
                <Route path="feedback" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Feedback /></ProtectedRoute>} />
                <Route path="feedback-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><FeedbackManagement /></ProtectedRoute>} />
                <Route path="training-management" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia', 'comunicação', 'digital']}><TrainingManagement /></ProtectedRoute>} />
                <Route path="training" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><Training /></ProtectedRoute>} />
                {/* Devoluções Consolidada (admin, supervisor, loja, devoluções, financeiro) - SEM franquia */}
                <Route path="returns" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'loja', 'devoluções', 'financeiro']}><ReturnsConsolidated /></ProtectedRoute>} />
                {/* Rota alternativa para planner (compatibilidade) */}
                <Route path="returns-planner" element={<ProtectedRoute allowedRoles={['devoluções', 'admin']}><ReturnsConsolidated /></ProtectedRoute>} />
                <Route path="chave" element={<Chave />} />
                <Route path="checklist" element={<DailyChecklist />} />
                <Route path="checklist-audit-analytics" element={<ProtectedRoute allowedRoles={['admin', 'supervisor', 'supervisor_franquia']}><ChecklistAuditAnalytics /></ProtectedRoute>} />
                {/* Checklists Consolidados */}
                <Route path="checklists" element={<ProtectedRoute allowedRoles={['admin', 'devoluções', 'motorista', 'comunicação', 'digital']}><ChecklistsManagement /></ProtectedRoute>} />
                {/* Checklists para Loja (página específica com abas) */}
                <Route path="store-checklists" element={<ProtectedRoute allowedRoles={['loja', 'loja_franquia']}><StoreChecklistsPage /></ProtectedRoute>} />
                {/* Gerenciar Checklists (apenas admin) */}
                <Route path="manage-checklists" element={<ProtectedRoute allowedRoles={['admin']}><ManageChecklists /></ProtectedRoute>} />
              </Route>
            </Routes>
          </Router>
          <Toaster />
        </DataProvider>
      </AuthProvider>
    </>
  );
}

export default App;