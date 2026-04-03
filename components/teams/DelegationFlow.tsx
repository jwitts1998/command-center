'use client';

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { TeamMemberWithAgent } from '@/types/team';
import type { Delegation } from '@/types/team';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GitBranch, ArrowRight } from 'lucide-react';

interface DelegationFlowProps {
  members: TeamMemberWithAgent[];
  delegations: Delegation[];
}

interface DelegationWithNames extends Delegation {
  from_agent_name?: string;
  to_agent_name?: string;
}

const nodeColors: Record<string, string> = {
  lead: '#eab308',
  member: '#3b82f6',
  advisor: '#a855f7',
};

export function DelegationFlow({ members, delegations }: DelegationFlowProps) {
  // Create a map of agent IDs to member data
  const memberMap = useMemo(() => {
    const map = new Map<string, TeamMemberWithAgent>();
    members.forEach((m) => map.set(m.agent_id, m));
    return map;
  }, [members]);

  // Generate nodes from team members
  const initialNodes: Node[] = useMemo(() => {
    const cols = Math.ceil(Math.sqrt(members.length));
    const spacing = { x: 200, y: 150 };

    return members.map((member, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);

      return {
        id: member.agent_id,
        type: 'default',
        position: { x: col * spacing.x + 50, y: row * spacing.y + 50 },
        data: {
          label: (
            <div className="text-center">
              <div className="font-medium text-sm">{member.agent.name}</div>
              <Badge
                variant="outline"
                className="text-[10px] mt-1"
                style={{
                  backgroundColor: `${nodeColors[member.role]}20`,
                  borderColor: nodeColors[member.role],
                }}
              >
                {member.role}
              </Badge>
            </div>
          ),
        },
        style: {
          border: `2px solid ${nodeColors[member.role]}`,
          borderRadius: '8px',
          padding: '10px',
          backgroundColor: 'white',
          minWidth: '120px',
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    });
  }, [members]);

  // Generate edges from delegations
  const initialEdges: Edge[] = useMemo(() => {
    return delegations
      .filter((d) => d.status === 'active')
      .map((delegation) => ({
        id: delegation.id,
        source: delegation.from_agent_id,
        target: delegation.to_agent_id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#6366f1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#6366f1',
        },
        label: `depth: ${delegation.depth}`,
        labelStyle: { fontSize: 10, fill: '#64748b' },
        labelBgStyle: { fill: 'white', fillOpacity: 0.8 },
      }));
  }, [delegations]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const activeDelegations = delegations.filter((d) => d.status === 'active');

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <GitBranch className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No team members to visualize</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Delegation Flow
          </CardTitle>
          <Badge variant="outline">
            {activeDelegations.length} active delegation{activeDelegations.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[400px] border-t">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable={false}
            panOnDrag
            zoomOnScroll
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Background color="#e2e8f0" gap={20} />
            <Controls showInteractive={false} />
            <MiniMap
              nodeColor={(node) => {
                const member = memberMap.get(node.id);
                return member ? nodeColors[member.role] : '#64748b';
              }}
              maskColor="rgba(0, 0, 0, 0.1)"
              style={{ backgroundColor: '#f8fafc' }}
            />
          </ReactFlow>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: nodeColors.lead }}
              />
              <span className="text-muted-foreground">Lead</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: nodeColors.member }}
              />
              <span className="text-muted-foreground">Member</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: nodeColors.advisor }}
              />
              <span className="text-muted-foreground">Advisor</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="h-3 w-3 text-indigo-500" />
              <span className="text-muted-foreground">Delegation</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
