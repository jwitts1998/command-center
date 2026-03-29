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
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Dashboard
            </Link>
            <Link
              href="/voice"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Voice
            </Link>
            <Link
              href="/enrich"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Enrich
            </Link>
            <Link
              href="/projects"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Projects
            </Link>
            <Link
              href="/activity"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Activity
            </Link>
            <Link
              href="/sessions"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Sessions
            </Link>
            <Link
              href="/patterns"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Patterns
            </Link>
            <Link
              href="/costs"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              Costs
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
