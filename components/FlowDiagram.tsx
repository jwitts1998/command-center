'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  MarkerType,
  ConnectionLineType,
  type NodeTypes,
} from '@xyflow/react';
import dagre from 'dagre';
import { nodeTypes, type FlowNodeData } from './flow-nodes';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { ProcessFlow, ProcessStep } from '@/lib/guides';
import '@xyflow/react/dist/style.css';

interface FlowDiagramProps {
  flow: ProcessFlow;
}

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 180;
const nodeHeight = 80;

function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction, nodesep: 80, ranksep: 100 });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}

function transformFlowToReactFlow(flow: ProcessFlow): {
  nodes: Node[];
  edges: Edge[];
} {
  const nodes: Node[] = flow.steps.map((step) => ({
    id: step.id,
    type: step.type,
    position: { x: 0, y: 0 }, // Will be set by dagre
    data: {
      label: step.label,
      description: step.description,
      stepType: step.type,
    } as FlowNodeData,
  }));

  const edges: Edge[] = [];

  flow.steps.forEach((step) => {
    if (!step.next) return;

    if (typeof step.next === 'string') {
      // Simple linear flow
      edges.push({
        id: `${step.id}-${step.next}`,
        source: step.id,
        target: step.next,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#64748b', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#64748b',
        },
      });
    } else {
      // Decision branch
      if (step.next.yes) {
        edges.push({
          id: `${step.id}-yes-${step.next.yes}`,
          source: step.id,
          target: step.next.yes,
          sourceHandle: 'yes',
          type: 'smoothstep',
          animated: true,
          label: 'Yes',
          labelStyle: { fill: '#22c55e', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: '#dcfce7', fillOpacity: 0.9 },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 4,
          style: { stroke: '#22c55e', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#22c55e',
          },
        });
      }
      if (step.next.no) {
        edges.push({
          id: `${step.id}-no-${step.next.no}`,
          source: step.id,
          target: step.next.no,
          sourceHandle: 'no',
          type: 'smoothstep',
          animated: true,
          label: 'No',
          labelStyle: { fill: '#ef4444', fontWeight: 600, fontSize: 12 },
          labelBgStyle: { fill: '#fee2e2', fillOpacity: 0.9 },
          labelBgPadding: [4, 4] as [number, number],
          labelBgBorderRadius: 4,
          style: { stroke: '#ef4444', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#ef4444',
          },
        });
      }
    }
  });

  return getLayoutedElements(nodes, edges);
}

export function FlowDiagram({ flow }: FlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<ProcessStep | null>(null);

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => transformFlowToReactFlow(flow),
    [flow]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const step = flow.steps.find((s) => s.id === node.id);
      setSelectedNode(step || null);
    },
    [flow.steps]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes as NodeTypes}
        connectionLineType={ConnectionLineType.SmoothStep}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#e2e8f0" gap={16} />
        <Controls
          showZoom
          showFitView
          showInteractive={false}
          position="bottom-right"
          className="!bg-background !border-border !shadow-md"
        />
      </ReactFlow>

      {/* Selected Node Details Panel */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-background border rounded-lg shadow-lg p-4 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{selectedNode.label}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedNode.description}
              </p>
            </div>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-muted-foreground hover:text-foreground p-1 rounded"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {selectedNode.next && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                NEXT STEP
              </p>
              {typeof selectedNode.next === 'string' ? (
                <Badge variant="outline" className="text-xs">
                  → {flow.steps.find((s) => s.id === selectedNode.next)?.label}
                </Badge>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {selectedNode.next.yes && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
                    >
                      Yes →{' '}
                      {flow.steps.find((s) => s.id === (selectedNode.next as { yes?: string }).yes)?.label}
                    </Badge>
                  )}
                  {selectedNode.next.no && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-red-500/10 text-red-600 border-red-500/20"
                    >
                      No →{' '}
                      {flow.steps.find((s) => s.id === (selectedNode.next as { no?: string }).no)?.label}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedNode.links && selectedNode.links.length > 0 && (
            <div className="mt-3 pt-3 border-t">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                RELATED LINKS
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedNode.links.map((link) => (
                  <Badge key={link} variant="secondary" className="text-xs">
                    {link}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
