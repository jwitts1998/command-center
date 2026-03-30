'use client';

import { useState } from 'react';
import { StatusBadge } from '@/components/StatusBadge';
import { formatCurrency } from '@/lib/utils';
import type { Task } from '@/types/task';
import { ChevronDown, ChevronRight, Circle, DollarSign } from 'lucide-react';
import Link from 'next/link';

interface TaskNode extends Task {
  children?: TaskNode[];
}

interface TaskTreeProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

// Build tree structure from flat list
function buildTaskTree(tasks: Task[]): TaskNode[] {
  const taskMap = new Map<string, TaskNode>();
  const roots: TaskNode[] = [];

  // Create nodes for all tasks
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  // Build tree structure
  tasks.forEach(task => {
    const node = taskMap.get(task.id)!;
    if (task.parent_task_id && taskMap.has(task.parent_task_id)) {
      const parent = taskMap.get(task.parent_task_id)!;
      parent.children = parent.children || [];
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  // Sort children by priority and creation date
  const sortNodes = (nodes: TaskNode[]) => {
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    nodes.sort((a, b) => {
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

const complexityColors: Record<string, string> = {
  trivial: 'bg-gray-200 dark:bg-gray-700',
  simple: 'bg-green-200 dark:bg-green-800',
  moderate: 'bg-yellow-200 dark:bg-yellow-800',
  complex: 'bg-orange-200 dark:bg-orange-800',
  epic: 'bg-red-200 dark:bg-red-800',
};

interface TaskTreeNodeProps {
  node: TaskNode;
  depth: number;
  onTaskClick?: (task: Task) => void;
}

function TaskTreeNode({ node, depth, onTaskClick }: TaskTreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="group flex items-center gap-2 p-2 rounded-md hover:bg-accent transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-muted"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <Circle className="h-2 w-2 text-muted-foreground ml-1 mr-1.5" />
        )}

        <Link
          href={`/tasks/${node.id}`}
          className="flex-1 flex items-center gap-2 min-w-0"
          onClick={() => onTaskClick?.(node)}
        >
          {node.complexity && (
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${complexityColors[node.complexity]}`}
              title={node.complexity}
            />
          )}
          <span className="truncate font-medium text-sm">{node.title}</span>
        </Link>

        <div className="flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {node.estimated_cost_usd && (
            <span className="text-xs text-muted-foreground flex items-center gap-0.5">
              <DollarSign className="h-3 w-3" />
              {formatCurrency(node.estimated_cost_usd)}
            </span>
          )}
        </div>

        <StatusBadge status={node.status} size="sm" />
      </div>

      {hasChildren && isExpanded && (
        <div className="border-l border-border ml-4">
          {node.children!.map(child => (
            <TaskTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onTaskClick={onTaskClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskTree({ tasks, onTaskClick }: TaskTreeProps) {
  const tree = buildTaskTree(tasks);

  if (tree.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No tasks yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tree.map(node => (
        <TaskTreeNode
          key={node.id}
          node={node}
          depth={0}
          onTaskClick={onTaskClick}
        />
      ))}
    </div>
  );
}
