'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useLayout } from '@/components/LayoutProvider';
import {
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
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Settings,
  Palette,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Core',
    items: [
      { label: 'Chat', href: '/chat', icon: <MessageSquare className="h-4 w-4" /> },
      { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
      { label: 'Activity', href: '/activity', icon: <Activity className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Work',
    items: [
      { label: 'Goals', href: '/goals', icon: <Target className="h-4 w-4" /> },
      { label: 'Tasks', href: '/tasks', icon: <CheckSquare className="h-4 w-4" /> },
      { label: 'Projects', href: '/projects', icon: <FolderKanban className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Agents',
    items: [
      { label: 'C-Suite', href: '/agents', icon: <Bot className="h-4 w-4" /> },
      { label: 'Approvals', href: '/approvals', icon: <Shield className="h-4 w-4" /> },
      { label: 'Teams', href: '/teams', icon: <UsersRound className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Growth',
    items: [
      { label: 'Marketing', href: '/marketing', icon: <Megaphone className="h-4 w-4" /> },
      { label: 'Costs', href: '/costs', icon: <DollarSign className="h-4 w-4" /> },
    ],
  },
  {
    label: 'Resources',
    items: [
      { label: 'Design', href: '/design', icon: <Palette className="h-4 w-4" /> },
      { label: 'Guides', href: '/guides', icon: <BookOpen className="h-4 w-4" /> },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useLayout();
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r bg-background transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          'flex h-14 items-center border-b px-4',
          collapsed ? 'justify-center' : 'justify-between'
        )}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">Command</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/" className="flex items-center justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Layers className="h-4 w-4 text-primary-foreground" />
              </div>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-4">
              {!collapsed && (
                <div className="mb-2 px-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {group.label}
                </div>
              )}
              <div className="space-y-1 px-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                        collapsed && 'justify-center px-2'
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      {item.icon}
                      {!collapsed && <span>{item.label}</span>}
                      {!collapsed && item.badge && (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Toggle */}
        <div className="border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className={cn('w-full', collapsed ? 'px-2' : '')}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </aside>
  );
}

export function SidebarSpacer({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div
      className={cn(
        'shrink-0 transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-56'
      )}
    />
  );
}
