import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import MaitriPage from './pages/MaitriPage';
import BharatiPage from './pages/BharatiPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import NotFoundPage from './pages/NotFoundPage';
import { TelemetryProvider } from './context/TelemetryContext';

export default function App() {
  return (
    <TelemetryProvider>
      <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* Default Redirect to Digital Twin visualizer */}
          <Route path="/" element={<Navigate to="/digital-twin" replace />} />
          
          {/* 1. Maitri Station Dashboard (Route: /maitri) */}
          <Route path="/maitri" element={<MaitriPage />} />

          {/* 2. Bharati Station Dashboard (Route: /bharati) */}
          <Route path="/bharati" element={<BharatiPage />} />

          {/* 3. Antarctic Digital Twin (Route: /digital-twin) */}
          <Route path="/digital-twin" element={<DigitalTwinPage />} />

          {/* 4. Privacy Policy (Route: /privacy) */}
          <Route path="/privacy" element={<PrivacyPage />} />

          {/* 5. Terms & Conditions (Route: /terms) */}
          <Route path="/terms" element={<TermsPage />} />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
      </BrowserRouter>
    </TelemetryProvider>
  );
}
