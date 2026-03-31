'use client';

import { VoiceCommands } from '@/components/VoiceCommands';
import { LayoutProvider, useLayout } from '@/components/LayoutProvider';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { cn } from '@/lib/utils';

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useLayout();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Sidebar - Hidden on mobile */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div
        className={cn(
          'flex min-h-screen flex-col transition-all duration-300',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-56'
        )}
      >
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-background">
          <div className="flex h-12 items-center px-4 md:px-6 text-sm text-muted-foreground">
            <p>Command Center — Built with Next.js, AI SDK, and PostgreSQL</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutProvider>
      {/* Global Voice Commands */}
      <VoiceCommands />
      <DashboardContent>{children}</DashboardContent>
    </LayoutProvider>
  );
}
