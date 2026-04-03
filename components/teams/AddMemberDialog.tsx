'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Agent } from '@/types/agent';
import type { TeamMemberRole } from '@/types/team';
import { Loader2, UserPlus, Bot } from 'lucide-react';

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  existingMemberIds: string[];
  onAdd: (agentId: string, role: TeamMemberRole) => Promise<void>;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  teamId,
  existingMemberIds,
  onAdd,
}: AddMemberDialogProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<TeamMemberRole>('member');
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  async function fetchAgents() {
    setLoading(true);
    try {
      const response = await fetch('/api/agents?status=active');
      const data = await response.json();
      if (data.success) {
        // Filter out agents already in the team
        const availableAgents = data.data.filter(
          (agent: Agent) => !existingMemberIds.includes(agent.id)
        );
        setAgents(availableAgents);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAdd = async () => {
    if (!selectedAgent) return;

    setIsAdding(true);
    try {
      await onAdd(selectedAgent, selectedRole);
      setSelectedAgent('');
      setSelectedRole('member');
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding member:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const selectedAgentData = agents.find((a) => a.id === selectedAgent);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Add Team Member
          </DialogTitle>
          <DialogDescription>
            Select an agent to add to this team
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Bot className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-center">
              No available agents to add
            </p>
            <p className="text-sm text-muted-foreground text-center mt-1">
              All active agents are already team members
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Select Agent</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an agent..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[200px]">
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        <div className="flex items-center gap-2">
                          <span>{agent.name}</span>
                          <Badge variant="outline" className="text-xs capitalize">
                            {agent.role}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            </div>

            {selectedAgentData && (
              <div className="rounded-lg border p-3 bg-muted/30">
                <p className="font-medium">{selectedAgentData.name}</p>
                <p className="text-sm text-muted-foreground">
                  @{selectedAgentData.slug}
                </p>
                {selectedAgentData.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {selectedAgentData.capabilities.slice(0, 5).map((cap) => (
                      <Badge key={cap} variant="secondary" className="text-xs">
                        {cap.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Role in Team</Label>
              <Select
                value={selectedRole}
                onValueChange={(v) => setSelectedRole(v as TeamMemberRole)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">
                    <div className="flex flex-col">
                      <span>Member</span>
                      <span className="text-xs text-muted-foreground">
                        Regular team member
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="advisor">
                    <div className="flex flex-col">
                      <span>Advisor</span>
                      <span className="text-xs text-muted-foreground">
                        Provides guidance and expertise
                      </span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lead">
                    <div className="flex flex-col">
                      <span>Lead</span>
                      <span className="text-xs text-muted-foreground">
                        Team leadership role
                      </span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={!selectedAgent || isAdding}>
                {isAdding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Member
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
