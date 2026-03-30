'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ApprovalCard } from '@/components/ApprovalCard';
import type { ApprovalRequest, ApprovalPolicy, ApprovalTriggerType } from '@/types/approval';
import { Shield, Clock, CheckCircle2, XCircle, AlertTriangle, Percent, Loader2 } from 'lucide-react';

type TabType = 'pending' | 'history' | 'policies';

export default function ApprovalsPage() {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [policies, setPolicies] = useState<ApprovalPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [createPolicyDialogOpen, setCreatePolicyDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('pending');

  const [policyForm, setPolicyForm] = useState({
    name: '',
    trigger_type: 'cost_threshold' as ApprovalTriggerType,
    threshold_usd: '25',
    operations: '',
    auto_approve_confidence: '0',
  });

  useEffect(() => {
    if (activeTab === 'policies') {
      fetchPolicies();
    } else {
      fetchRequests();
    }
  }, [activeTab, filterStatus]);

  async function fetchRequests() {
    try {
      const params = new URLSearchParams();
      if (activeTab === 'pending') {
        params.set('status', 'pending');
      } else if (filterStatus !== 'all') {
        params.set('status', filterStatus);
      }

      const response = await fetch(`/api/approvals?${params}`);
      const data = await response.json();
      if (data.success) {
        setRequests(data.data);
      }
    } catch (error) {
      console.error('Error fetching approvals:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPolicies() {
    try {
      const response = await fetch('/api/approvals/policies');
      const data = await response.json();
      if (data.success) {
        setPolicies(data.data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(requestId: string) {
    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/approvals/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decided_by: 'user' }),
      });
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleReject(requestId: string) {
    const reason = prompt('Reason for rejection (optional):');
    setActionLoading(requestId);
    try {
      const response = await fetch(`/api/approvals/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decided_by: 'user', reason }),
      });
      const data = await response.json();
      if (data.success) {
        fetchRequests();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleCreatePolicy(e: React.FormEvent) {
    e.preventDefault();

    let trigger_config: Record<string, unknown> = {};
    if (policyForm.trigger_type === 'cost_threshold') {
      trigger_config = { threshold_usd: parseFloat(policyForm.threshold_usd) };
    } else if (policyForm.trigger_type === 'operation_type') {
      trigger_config = {
        operations: policyForm.operations.split(',').map(o => o.trim()).filter(o => o),
      };
    }

    try {
      const response = await fetch('/api/approvals/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: policyForm.name,
          trigger_type: policyForm.trigger_type,
          trigger_config,
          auto_approve_confidence: parseFloat(policyForm.auto_approve_confidence) || 0,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setCreatePolicyDialogOpen(false);
        setPolicyForm({
          name: '',
          trigger_type: 'cost_threshold',
          threshold_usd: '25',
          operations: '',
          auto_approve_confidence: '0',
        });
        fetchPolicies();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      alert('Failed to create policy');
    }
  }

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const autoApprovedCount = requests.filter(r => r.status === 'auto_approved').length;

  if (loading && requests.length === 0 && policies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading approvals...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
          <p className="text-muted-foreground">
            Review pending approvals and manage approval policies
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card
          className={`cursor-pointer transition-colors ${activeTab === 'pending' ? 'border-primary' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Auto-Approved</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{autoApprovedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b">
        <Button
          variant={activeTab === 'pending' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('pending')}
        >
          Pending ({pendingCount})
        </Button>
        <Button
          variant={activeTab === 'history' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('history')}
        >
          History
        </Button>
        <Button
          variant={activeTab === 'policies' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'pending' && (
        <div>
          {requests.filter(r => r.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">No pending approvals</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests
                .filter(r => r.status === 'pending')
                .map((request) => (
                  <ApprovalCard
                    key={request.id}
                    approval={request}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="w-40">
            <Select value={filterStatus} onValueChange={(v) => { setFilterStatus(v); setLoading(true); }}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="auto_approved">Auto-Approved</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {requests.filter(r => r.status !== 'pending').length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No approval history</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {requests
                .filter(r => r.status !== 'pending')
                .map((request) => (
                  <ApprovalCard
                    key={request.id}
                    approval={request}
                    showActions={false}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={createPolicyDialogOpen} onOpenChange={setCreatePolicyDialogOpen}>
              <DialogTrigger asChild>
                <Button>Create Policy</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Approval Policy</DialogTitle>
                  <DialogDescription>
                    Define when operations require approval
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreatePolicy} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Policy Name *</Label>
                    <Input
                      id="name"
                      placeholder="High Cost Operations"
                      value={policyForm.name}
                      onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="trigger_type">Trigger Type</Label>
                    <Select
                      value={policyForm.trigger_type}
                      onValueChange={(value) => setPolicyForm({ ...policyForm, trigger_type: value as ApprovalTriggerType })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cost_threshold">Cost Threshold</SelectItem>
                        <SelectItem value="operation_type">Operation Type</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {policyForm.trigger_type === 'cost_threshold' && (
                    <div className="space-y-2">
                      <Label htmlFor="threshold">Threshold (USD)</Label>
                      <Input
                        id="threshold"
                        type="number"
                        step="0.01"
                        value={policyForm.threshold_usd}
                        onChange={(e) => setPolicyForm({ ...policyForm, threshold_usd: e.target.value })}
                      />
                    </div>
                  )}
                  {policyForm.trigger_type === 'operation_type' && (
                    <div className="space-y-2">
                      <Label htmlFor="operations">Operations (comma-separated)</Label>
                      <Input
                        id="operations"
                        placeholder="deploy_production, delete_files"
                        value={policyForm.operations}
                        onChange={(e) => setPolicyForm({ ...policyForm, operations: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Auto-Approve Confidence (0-1)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={policyForm.auto_approve_confidence}
                      onChange={(e) => setPolicyForm({ ...policyForm, auto_approve_confidence: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">
                      Operations above this confidence level auto-approve
                    </p>
                  </div>
                  <Button type="submit" className="w-full">Create Policy</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {policies.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">No policies defined</p>
                <Button onClick={() => setCreatePolicyDialogOpen(true)}>
                  Create Your First Policy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {policies.map((policy) => (
                <Card key={policy.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <Badge variant={policy.is_active ? 'default' : 'secondary'}>
                        {policy.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <CardDescription>
                      {policy.trigger_type.replace(/_/g, ' ')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <span>{policy.times_approved} approved</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <XCircle className="h-4 w-4 text-red-500" />
                        <span>{policy.times_rejected} rejected</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Percent className="h-4 w-4 text-muted-foreground" />
                      <span>Auto-approve at {(policy.auto_approve_confidence * 100).toFixed(0)}% confidence</span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded">
                      {JSON.stringify(policy.trigger_config)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
