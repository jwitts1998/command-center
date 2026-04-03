'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLayout } from '@/components/LayoutProvider';
import { Button } from '@/components/ui/button';
import { CommandPalette } from '@/components/CommandPalette';
import {
  Settings,
  Mic,
  Menu,
  X,
  MessageSquare,
  LayoutDashboard,
  Target,
  CheckSquare,
  Bot,
  Shield,
  UsersRound,
  Activity,
  FolderKanban,
  Megaphone,
  DollarSign,
  BookOpen,
  Palette,
  Layers,
  Bell,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

const mobileNavItems = [
  { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-5 w-5" /> },
  { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
  { label: 'Goals', href: '/goals', icon: <Target className="h-5 w-5" /> },
  { label: 'Tasks', href: '/tasks', icon: <CheckSquare className="h-5 w-5" /> },
  { label: 'Agents', href: '/agents', icon: <Bot className="h-5 w-5" /> },
  { label: 'Activity', href: '/activity', icon: <Activity className="h-5 w-5" /> },
  { label: 'Projects', href: '/projects', icon: <FolderKanban className="h-5 w-5" /> },
  { label: 'Approvals', href: '/approvals', icon: <Shield className="h-5 w-5" /> },
  { label: 'Teams', href: '/teams', icon: <UsersRound className="h-5 w-5" /> },
  { label: 'Marketing', href: '/marketing', icon: <Megaphone className="h-5 w-5" /> },
  { label: 'Costs', href: '/costs', icon: <DollarSign className="h-5 w-5" /> },
  { label: 'Notifications', href: '/notifications', icon: <Bell className="h-5 w-5" /> },
  { label: 'Design', href: '/design', icon: <Palette className="h-5 w-5" /> },
  { label: 'Guides', href: '/guides', icon: <BookOpen className="h-5 w-5" /> },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { sidebarCollapsed } = useLayout();
  const pathname = usePathname();

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-30 h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all duration-300',
          sidebarCollapsed ? 'md:pl-16' : 'md:pl-56'
        )}
      >
        <div className="flex h-full items-center justify-between px-4 md:px-6">
          {/* Left side - Mobile menu + Command Palette */}
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>

            {/* Mobile logo */}
            <Link href="/" className="flex items-center gap-2 md:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
            </Link>

            {/* Command Palette */}
            <div className="hidden sm:block">
              <CommandPalette />
            </div>
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1">
            {/* Voice Input */}
            <Button variant="ghost" size="icon" asChild className="hidden sm:flex">
              <Link href="/voice">
                <Mic className="h-4 w-4" />
                <span className="sr-only">Voice Input</span>
              </Link>
            </Button>

            {/* Notifications */}
            <NotificationBell />

            {/* Settings */}
            <Button variant="ghost" size="icon">
              <Settings className="h-4 w-4" />
              <span className="sr-only">Settings</span>
            </Button>

            {/* User Avatar */}
            <Button variant="ghost" size="icon" className="ml-1">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-xs font-medium text-white">
                JW
              </div>
            </Button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu Panel */}
          <div className="absolute left-0 top-0 h-full w-72 bg-background shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              <Link href="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Layers className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold">Command Center</span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="p-4">
              <div className="space-y-1">
                {mobileNavItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                      )}
                    >
                      {item.icon}
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
