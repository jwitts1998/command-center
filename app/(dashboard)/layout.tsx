import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { VoiceCommands } from '@/components/VoiceCommands';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Global Voice Commands */}
      <VoiceCommands />
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <span className="text-xl font-bold">Command Center</span>
              <Badge variant="secondary" className="ml-2">MVP</Badge>
            </Link>
          </div>
          <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
            <Link
              href="/chat"
              className="transition-colors hover:text-foreground/80 text-foreground font-semibold"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              href="/goals"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Goals
            </Link>
            <Link
              href="/tasks"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Tasks
            </Link>
            <Link
              href="/agents"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Agents
            </Link>
            <Link
              href="/approvals"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Approvals
            </Link>
            <Link
              href="/teams"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Teams
            </Link>
            <Link
              href="/activity"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Activity
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Projects
            </Link>
            <Link
              href="/costs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Costs
            </Link>
            <Link
              href="/design"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Design
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t">
        <div className="container flex h-12 items-center text-sm text-muted-foreground">
          <p>Built with Next.js, AI SDK, and PostgreSQL</p>
        </div>
      </footer>
    </div>
  );
}
