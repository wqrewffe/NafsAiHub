import React, { ReactNode } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {

  return (
    <div className="min-h-screen bg-primary text-light flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8 fade-in">
        {children}
      </main>
      <footer className="bg-secondary/50 text-center py-4 text-slate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} Naf's AI Hub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Layout;
