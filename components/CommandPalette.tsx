'use client';

import { useCallback, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  LayoutDashboard,
  Target,
  CheckSquare,
  Users,
  Shield,
  UsersRound,
  Activity,
  FolderKanban,
  Megaphone,
  DollarSign,
  Palette,
  BookOpen,
  Mic,
  Plus,
  Search,
  Zap,
  Bot,
  Sparkles,
  Send,
  Clock,
  ArrowRight,
  Command as CommandIcon,
  Settings,
  FileText,
  Play,
  Pause,
  RefreshCw,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  shortcut?: string[];
  action: () => void;
  category: 'navigation' | 'actions' | 'agents' | 'recent';
  keywords?: string[];
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const router = useRouter();

  // Load recent commands from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('command-palette-recent');
    if (stored) {
      setRecentCommands(JSON.parse(stored));
    }
  }, []);

  // Save recent command
  const trackRecent = useCallback((id: string) => {
    setRecentCommands((prev) => {
      const updated = [id, ...prev.filter((i) => i !== id)].slice(0, 5);
      localStorage.setItem('command-palette-recent', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Toggle on Cmd+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = useCallback(
    (command: CommandItem) => {
      trackRecent(command.id);
      setOpen(false);
      setSearch('');
      command.action();
    },
    [trackRecent]
  );

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  // Define all commands
  const commands: CommandItem[] = [
    // Navigation
    {
      id: 'nav-chat',
      label: 'Go to Chat',
      description: 'Open the chat interface',
      icon: <MessageSquare className="h-4 w-4" />,
      shortcut: ['G', 'C'],
      action: () => navigate('/chat'),
      category: 'navigation',
      keywords: ['message', 'conversation', 'talk'],
    },
    {
      id: 'nav-dashboard',
      label: 'Go to Dashboard',
      description: 'View portfolio overview',
      icon: <LayoutDashboard className="h-4 w-4" />,
      shortcut: ['G', 'D'],
      action: () => navigate('/dashboard'),
      category: 'navigation',
      keywords: ['home', 'overview', 'main'],
    },
    {
      id: 'nav-goals',
      label: 'Go to Goals',
      description: 'Manage strategic goals',
      icon: <Target className="h-4 w-4" />,
      shortcut: ['G', 'G'],
      action: () => navigate('/goals'),
      category: 'navigation',
      keywords: ['objectives', 'targets', 'milestones'],
    },
    {
      id: 'nav-tasks',
      label: 'Go to Tasks',
      description: 'View and manage tasks',
      icon: <CheckSquare className="h-4 w-4" />,
      shortcut: ['G', 'T'],
      action: () => navigate('/tasks'),
      category: 'navigation',
      keywords: ['todo', 'work', 'items'],
    },
    {
      id: 'nav-agents',
      label: 'Go to Agents',
      description: 'Manage C-Suite agents',
      icon: <Bot className="h-4 w-4" />,
      shortcut: ['G', 'A'],
      action: () => navigate('/agents'),
      category: 'navigation',
      keywords: ['ceo', 'cto', 'cmo', 'ai'],
    },
    {
      id: 'nav-approvals',
      label: 'Go to Approvals',
      description: 'Review pending approvals',
      icon: <Shield className="h-4 w-4" />,
      action: () => navigate('/approvals'),
      category: 'navigation',
      keywords: ['review', 'approve', 'reject', 'governance'],
    },
    {
      id: 'nav-teams',
      label: 'Go to Teams',
      description: 'Manage teams and delegations',
      icon: <UsersRound className="h-4 w-4" />,
      action: () => navigate('/teams'),
      category: 'navigation',
      keywords: ['organization', 'members', 'groups'],
    },
    {
      id: 'nav-activity',
      label: 'Go to Activity',
      description: 'View real-time activity feed',
      icon: <Activity className="h-4 w-4" />,
      shortcut: ['G', 'V'],
      action: () => navigate('/activity'),
      category: 'navigation',
      keywords: ['feed', 'stream', 'events', 'logs'],
    },
    {
      id: 'nav-projects',
      label: 'Go to Projects',
      description: 'Manage portfolio projects',
      icon: <FolderKanban className="h-4 w-4" />,
      action: () => navigate('/projects'),
      category: 'navigation',
      keywords: ['repos', 'repositories', 'portfolio'],
    },
    {
      id: 'nav-marketing',
      label: 'Go to Marketing',
      description: 'Marketing campaigns and assets',
      icon: <Megaphone className="h-4 w-4" />,
      action: () => navigate('/marketing'),
      category: 'navigation',
      keywords: ['campaigns', 'content', 'growth'],
    },
    {
      id: 'nav-costs',
      label: 'Go to Costs',
      description: 'Track API costs and budgets',
      icon: <DollarSign className="h-4 w-4" />,
      action: () => navigate('/costs'),
      category: 'navigation',
      keywords: ['budget', 'spending', 'tokens', 'usage'],
    },
    {
      id: 'nav-guides',
      label: 'Go to Guides',
      description: 'View user guides and documentation',
      icon: <BookOpen className="h-4 w-4" />,
      shortcut: ['G', '?'],
      action: () => navigate('/guides'),
      category: 'navigation',
      keywords: ['help', 'docs', 'documentation', 'learn'],
    },

    // Actions
    {
      id: 'action-new-goal',
      label: 'Create New Goal',
      description: 'Start a new strategic goal',
      icon: <Plus className="h-4 w-4" />,
      shortcut: ['N', 'G'],
      action: () => navigate('/goals?action=create'),
      category: 'actions',
      keywords: ['add', 'goal', 'objective'],
    },
    {
      id: 'action-new-task',
      label: 'Create New Task',
      description: 'Add a new task',
      icon: <Plus className="h-4 w-4" />,
      shortcut: ['N', 'T'],
      action: () => navigate('/tasks?action=create'),
      category: 'actions',
      keywords: ['add', 'task', 'todo'],
    },
    {
      id: 'action-new-project',
      label: 'Create New Project',
      description: 'Add a new project to portfolio',
      icon: <Plus className="h-4 w-4" />,
      shortcut: ['N', 'P'],
      action: () => navigate('/projects?action=create'),
      category: 'actions',
      keywords: ['add', 'project', 'repo'],
    },
    {
      id: 'action-voice',
      label: 'Voice Input',
      description: 'Submit request via voice',
      icon: <Mic className="h-4 w-4" />,
      shortcut: ['⌃', '⇧', 'V'],
      action: () => navigate('/voice'),
      category: 'actions',
      keywords: ['speak', 'record', 'microphone'],
    },
    {
      id: 'action-refresh-status',
      label: 'Refresh Portfolio Status',
      description: 'Fetch latest status from all repos',
      icon: <RefreshCw className="h-4 w-4" />,
      action: async () => {
        await fetch('/api/status', { method: 'POST' });
        window.location.reload();
      },
      category: 'actions',
      keywords: ['sync', 'update', 'reload'],
    },

    // Agent Commands
    {
      id: 'agent-ask-ceo',
      label: 'Ask CEO',
      description: 'Strategic guidance and prioritization',
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      action: () => navigate('/chat?agent=ceo'),
      category: 'agents',
      keywords: ['strategy', 'prioritize', 'business', 'direction'],
    },
    {
      id: 'agent-ask-cto',
      label: 'Ask CTO',
      description: 'Technical implementation help',
      icon: <Zap className="h-4 w-4 text-blue-500" />,
      action: () => navigate('/chat?agent=cto'),
      category: 'agents',
      keywords: ['code', 'technical', 'implement', 'architecture'],
    },
    {
      id: 'agent-ask-cmo',
      label: 'Ask CMO',
      description: 'Marketing and growth guidance',
      icon: <Megaphone className="h-4 w-4 text-green-500" />,
      action: () => navigate('/chat?agent=cmo'),
      category: 'agents',
      keywords: ['marketing', 'growth', 'acquisition', 'content'],
    },
    {
      id: 'agent-dispatch',
      label: 'Dispatch Task to Agent',
      description: 'Send a task to the best agent',
      icon: <Send className="h-4 w-4" />,
      action: () => navigate('/chat?mode=dispatch'),
      category: 'agents',
      keywords: ['send', 'assign', 'route'],
    },
  ];

  // Filter commands by search
  const filteredCommands = commands.filter((cmd) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description?.toLowerCase().includes(searchLower) ||
      cmd.keywords?.some((k) => k.toLowerCase().includes(searchLower))
    );
  });

  // Group by category
  const navigationCommands = filteredCommands.filter((c) => c.category === 'navigation');
  const actionCommands = filteredCommands.filter((c) => c.category === 'actions');
  const agentCommands = filteredCommands.filter((c) => c.category === 'agents');

  // Recent commands
  const recentCommandItems = recentCommands
    .map((id) => commands.find((c) => c.id === id))
    .filter(Boolean) as CommandItem[];

  return (
    <>
      {/* Trigger hint in header */}
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-md border bg-muted/50 hover:bg-muted transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search...</span>
        <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-background px-1.5 font-mono text-[10px] font-medium opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Command Dialog */}
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Command Palette"
        className="fixed inset-0 z-50"
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />

        {/* Dialog */}
        <div className="fixed left-1/2 top-[20%] -translate-x-1/2 w-full max-w-xl">
          <div className="bg-background border rounded-xl shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Search Input */}
            <div className="flex items-center border-b px-4">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <Command.Input
                value={search}
                onValueChange={setSearch}
                placeholder="Type a command or search..."
                className="flex-1 px-3 py-4 text-sm bg-transparent outline-none placeholder:text-muted-foreground"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <span className="text-xs">Clear</span>
                </button>
              )}
            </div>

            {/* Commands List */}
            <Command.List className="max-h-[60vh] overflow-y-auto p-2">
              <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </Command.Empty>

              {/* Recent */}
              {!search && recentCommandItems.length > 0 && (
                <Command.Group heading="Recent" className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Recent
                  </div>
                  {recentCommandItems.map((cmd) => (
                    <CommandItem
                      key={`recent-${cmd.id}`}
                      command={cmd}
                      onSelect={() => runCommand(cmd)}
                    />
                  ))}
                </Command.Group>
              )}

              {/* Agents */}
              {agentCommands.length > 0 && (
                <Command.Group heading="Agents" className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Agents
                  </div>
                  {agentCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      onSelect={() => runCommand(cmd)}
                    />
                  ))}
                </Command.Group>
              )}

              {/* Actions */}
              {actionCommands.length > 0 && (
                <Command.Group heading="Actions" className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Actions
                  </div>
                  {actionCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      onSelect={() => runCommand(cmd)}
                    />
                  ))}
                </Command.Group>
              )}

              {/* Navigation */}
              {navigationCommands.length > 0 && (
                <Command.Group heading="Navigation" className="mb-2">
                  <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                    Navigation
                  </div>
                  {navigationCommands.map((cmd) => (
                    <CommandItem
                      key={cmd.id}
                      command={cmd}
                      onSelect={() => runCommand(cmd)}
                    />
                  ))}
                </Command.Group>
              )}
            </Command.List>

            {/* Footer */}
            <div className="border-t px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↑↓</kbd>
                  Navigate
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">↵</kbd>
                  Select
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono">esc</kbd>
                  Close
                </span>
              </div>
            </div>
          </div>
        </div>
      </Command.Dialog>
    </>
  );
}

function CommandItem({
  command,
  onSelect,
}: {
  command: CommandItem;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={command.id}
      onSelect={onSelect}
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground outline-none"
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted shrink-0">
        {command.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{command.label}</div>
        {command.description && (
          <div className="text-xs text-muted-foreground truncate">
            {command.description}
          </div>
        )}
      </div>
      {command.shortcut && (
        <div className="flex items-center gap-1 shrink-0">
          {command.shortcut.map((key, i) => (
            <kbd
              key={i}
              className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono"
            >
              {key}
            </kbd>
          ))}
        </div>
      )}
      <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
    </Command.Item>
  );
}
