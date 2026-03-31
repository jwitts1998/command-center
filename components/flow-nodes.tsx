'use client';

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Circle, Diamond, Square, Play, CheckCircle } from 'lucide-react';

export interface FlowNodeData {
  label: string;
  description: string;
  stepType: 'start' | 'process' | 'decision' | 'end' | 'parallel';
  [key: string]: unknown;
}

interface CustomNodeProps {
  data: FlowNodeData;
  selected?: boolean;
}

const nodeStyles = {
  start: {
    bg: 'bg-green-500/10',
    border: 'border-green-500',
    text: 'text-green-700 dark:text-green-400',
    icon: Circle,
    iconFill: 'fill-green-500',
  },
  end: {
    bg: 'bg-red-500/10',
    border: 'border-red-500',
    text: 'text-red-700 dark:text-red-400',
    icon: CheckCircle,
    iconFill: 'fill-red-500',
  },
  decision: {
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: Diamond,
    iconFill: 'fill-yellow-500/20',
  },
  process: {
    bg: 'bg-blue-500/10',
    border: 'border-blue-500',
    text: 'text-blue-700 dark:text-blue-400',
    icon: Square,
    iconFill: 'fill-blue-500/20',
  },
  parallel: {
    bg: 'bg-purple-500/10',
    border: 'border-purple-500',
    text: 'text-purple-700 dark:text-purple-400',
    icon: Play,
    iconFill: 'fill-purple-500/20',
  },
};

export const StartNode = memo(({ data, selected }: CustomNodeProps) => {
  const style = nodeStyles.start;
  const Icon = style.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-full border-2 min-w-[140px] text-center transition-all
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-offset-2 ring-green-500' : ''}
      `}
    >
      <div className="flex items-center justify-center gap-2">
        <Icon className={`h-4 w-4 ${style.text} ${style.iconFill}`} />
        <span className={`text-sm font-medium ${style.text}`}>{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
});
StartNode.displayName = 'StartNode';

export const EndNode = memo(({ data, selected }: CustomNodeProps) => {
  const style = nodeStyles.end;
  const Icon = style.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-full border-2 min-w-[140px] text-center transition-all
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-offset-2 ring-red-500' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-red-500 !w-3 !h-3"
      />
      <div className="flex items-center justify-center gap-2">
        <Icon className={`h-4 w-4 ${style.text}`} />
        <span className={`text-sm font-medium ${style.text}`}>{data.label}</span>
      </div>
    </div>
  );
});
EndNode.displayName = 'EndNode';

export const ProcessNode = memo(({ data, selected }: CustomNodeProps) => {
  const style = nodeStyles.process;
  const Icon = style.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 min-w-[160px] max-w-[220px] transition-all
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-blue-500 !w-3 !h-3"
      />
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.text} ${style.iconFill}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${style.text}`}>{data.label}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </div>
  );
});
ProcessNode.displayName = 'ProcessNode';

export const DecisionNode = memo(({ data, selected }: CustomNodeProps) => {
  const style = nodeStyles.decision;
  const Icon = style.icon;

  return (
    <div
      className={`
        px-5 py-4 border-2 min-w-[160px] max-w-[200px] text-center transition-all
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-offset-2 ring-yellow-500' : ''}
      `}
      style={{
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-yellow-500 !w-3 !h-3"
        style={{ top: -6 }}
      />
      <div className="flex flex-col items-center gap-1">
        <Icon className={`h-4 w-4 ${style.text} ${style.iconFill}`} />
        <span className={`text-xs font-medium ${style.text} leading-tight`}>{data.label}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="!bg-yellow-500 !w-3 !h-3"
        style={{ bottom: -6 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="!bg-green-500 !w-3 !h-3"
        style={{ right: -6 }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        className="!bg-red-500 !w-3 !h-3"
        style={{ left: -6 }}
      />
    </div>
  );
});
DecisionNode.displayName = 'DecisionNode';

export const ParallelNode = memo(({ data, selected }: CustomNodeProps) => {
  const style = nodeStyles.parallel;
  const Icon = style.icon;

  return (
    <div
      className={`
        px-4 py-3 rounded-lg border-2 border-dashed min-w-[160px] max-w-[220px] transition-all
        ${style.bg} ${style.border}
        ${selected ? 'ring-2 ring-offset-2 ring-purple-500' : ''}
      `}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!bg-purple-500 !w-3 !h-3"
      />
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${style.text} ${style.iconFill}`} />
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${style.text}`}>{data.label}</div>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-purple-500 !w-3 !h-3"
      />
    </div>
  );
});
ParallelNode.displayName = 'ParallelNode';

export const nodeTypes = {
  start: StartNode,
  end: EndNode,
  process: ProcessNode,
  decision: DecisionNode,
  parallel: ParallelNode,
};
