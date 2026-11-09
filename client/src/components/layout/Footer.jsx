import React from 'react';

export const Footer = () => {
  return (
    <footer className="w-full border-t border-slate-200 bg-white py-4 px-4 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© 2026 Record Technology Labs. Full Stack Developer Onboarding.</p>
        <div className="flex items-center space-x-4">
          <span>React + Vite</span>
          <span>•</span>
          <span>Node.js + Express</span>
          <span>•</span>
          <span>MongoDB GridFS</span>
        </div>
      </div>
    </footer>
  );
};

