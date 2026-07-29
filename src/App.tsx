import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Chatbot from './pages/Chatbot';
import Callbot from './pages/Callbot';
import CRM from './pages/CRM';
import Commerce from './pages/Commerce';
import AITraining from './pages/AITraining';
import RagVerification from './pages/RagVerification';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/chat" element={<Chatbot />} />
        <Route path="/call" element={<Callbot />} />
        <Route path="/crm" element={<CRM />} />
        <Route path="/commerce" element={<Commerce />} />
        <Route path="/training" element={<AITraining />} />
        <Route path="/rag" element={<RagVerification />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
