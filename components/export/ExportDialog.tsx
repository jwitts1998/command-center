'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, Loader2 } from 'lucide-react';

export type ExportType = 'sessions' | 'costs' | 'tasks' | 'agents';
export type ExportFormat = 'csv' | 'json';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exportType: ExportType;
  title?: string;
}

export function ExportDialog({
  open,
  onOpenChange,
  exportType,
  title,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const exportTypeLabels: Record<ExportType, string> = {
    sessions: 'Sessions',
    costs: 'Costs',
    tasks: 'Tasks',
    agents: 'Agents',
  };

  const statusOptions: Record<ExportType, string[]> = {
    sessions: ['running', 'completed', 'failed'],
    costs: [],
    tasks: ['pending', 'in_progress', 'completed', 'failed', 'blocked'],
    agents: ['active', 'paused', 'offline'],
  };

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (startDate) params.set('start_date', startDate);
      if (endDate) params.set('end_date', endDate);
      if (status) params.set('status', status);

      const response = await fetch(`/api/export/${exportType}?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `${exportType}-export.${format}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setFormat('csv');
    setStartDate('');
    setEndDate('');
    setStatus('');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {title || `Export ${exportTypeLabels[exportType]}`}
          </DialogTitle>
          <DialogDescription>
            Configure export options and download your data.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="format">Format</Label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger id="format">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="json">JSON</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportType !== 'agents' && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}

          {statusOptions[exportType].length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="status">Status Filter</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions[exportType].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between sm:justify-between">
          <Button variant="ghost" onClick={handleReset} disabled={loading}>
            Reset
          </Button>
          <Button onClick={handleExport} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
