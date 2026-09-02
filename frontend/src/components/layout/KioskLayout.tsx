import type { ReactNode } from 'react';
import Header from './Header';
import ProgressBar from './ProgressBar';

interface KioskLayoutProps {
  children: ReactNode;
  showProgress?: boolean;
}

export default function KioskLayout({ children, showProgress = true }: KioskLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-navy-50">
      <Header />
      {showProgress && <ProgressBar />}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
