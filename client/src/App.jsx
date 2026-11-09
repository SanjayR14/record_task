import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { VerificationProvider } from '@/context/VerificationContext';
import { AppRoutes } from '@/routes/AppRoutes';

export const App = () => {
  return (
    <BrowserRouter>
      <VerificationProvider>
        <AppRoutes />
      </VerificationProvider>
    </BrowserRouter>
  );
};

export default App;
