import { type ReactNode } from 'react';
import { RAHeader } from '../components/header';
import {RAFooter} from '../components/footer';


interface LayoutProps {
  children: ReactNode;
  showHeader?: boolean;
}

export function Layout({ children, showHeader = true }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {showHeader && <RAHeader />}
      <main className={showHeader ? "pt-16 md:pt-20" : ""}>
        {children}
      </main>
      <RAFooter />
    </div>
  );
}

export default Layout;
