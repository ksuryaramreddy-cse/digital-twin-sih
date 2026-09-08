import React from 'react';
import Navbar from './Navbar';
import FooterStatus from './FooterStatus';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-polar-950 bg-tactical-grid text-slate-100 selection:bg-cyan-500 selection:text-polar-950">
      <Navbar />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <FooterStatus />
    </div>
  );
}

