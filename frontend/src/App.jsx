import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AccountProvider } from './context/AccountContext';
import DashboardLayout from './components/DashboardLayout';
import CampaignCreator from './components/CampaignCreator';
import HistoryLogs from './components/HistoryLogs';
import TemplateManager from './components/TemplateManager';
import Login from './components/Login';
import ProtectedRoutes from './components/ProtectedRoutes';

function App() {
  return (
    <AccountProvider>
      <Router>
        <Toaster position="top-right" />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoutes />}>
            <Route path="/" element={
              <DashboardLayout>
                <CampaignCreator />
              </DashboardLayout>
            } />
            <Route path="/logs" element={
              <DashboardLayout>
                <HistoryLogs />
              </DashboardLayout>
            } />
            <Route path="/templates" element={
              <DashboardLayout>
                <TemplateManager />
              </DashboardLayout>
            } />
          </Route>
        </Routes>
      </Router>
    </AccountProvider>
  );
}

export default App;

