import React from 'react';
import { Header } from './Header';
import { Footer } from './Footer';

export const AppLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased">
      <Header />
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-6 sm:py-8 md:py-10 flex flex-col items-center">
        {children}
      </main>
      <Footer />
    </div>
  );
};

