import React from 'react';
import { Routes as RouterRoutes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import VirtualCards from './pages/VirtualCards';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Ecosystem from './pages/Ecosystem';
import GeminiDemo from './pages/GeminiDemo';
import PerplexityDemo from './pages/PerplexityDemo';
import NotFound from './pages/NotFound';

const Routes: React.FC = () => {
  return (
    <RouterRoutes>
      <Route path="/" element={<Index />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/virtual-cards" element={<VirtualCards />} />
      <Route path="/insights" element={<Insights />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/ecosystem" element={<Ecosystem />} />
      <Route path="/demo/gemini" element={<GeminiDemo />} />
      <Route path="/demo/perplexity" element={<PerplexityDemo />} />
      <Route path="*" element={<NotFound />} />
    </RouterRoutes>
  );
};

export default Routes;
