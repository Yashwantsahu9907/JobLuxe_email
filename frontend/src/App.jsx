import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AccountProvider } from './context/AccountContext';
import DashboardLayout from './components/DashboardLayout';
import CampaignCreator from './components/CampaignCreator';
import HistoryLogs from './components/HistoryLogs';
import TemplateManager from './components/TemplateManager';

function App() {
  return (
    <AccountProvider>
      <Router>
        <Toaster position="top-right" />
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<CampaignCreator />} />
            <Route path="/logs" element={<HistoryLogs />} />
            <Route path="/templates" element={<TemplateManager />} />
          </Routes>
        </DashboardLayout>
      </Router>
    </AccountProvider>
  );
}

export default App;
