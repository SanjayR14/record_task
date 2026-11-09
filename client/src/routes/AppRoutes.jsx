import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import VerificationFlow from '@/pages/verification/VerificationFlow';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root path opens directly into the candidate verification interface */}
      <Route path="/" element={<Navigate to="/verify/demo-candidate-2026/language" replace />} />
      <Route path="/verify/:token" element={<VerificationFlow />} />
      <Route path="/verify/:token/:step" element={<VerificationFlow />} />
      <Route path="/verify/:token/:step/:qIdx" element={<VerificationFlow />} />
      <Route path="/verify" element={<Navigate to="/verify/demo-candidate-2026/language" replace />} />
      <Route
        path="*"
        element={
          <div className="min-h-screen bg-[#F8F6F1] flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900">404 - Link Not Found</h2>
            <p className="text-xs text-slate-500">The requested verification URL is invalid.</p>
            <a
              href="/verify/demo-candidate-2026/language"
              className="py-2.5 px-4 bg-[#FF5723] text-white text-xs font-semibold rounded-xl"
            >
              Start Candidate Verification
            </a>
          </div>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
