'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { ExportDialog, type ExportType } from './ExportDialog';

interface ExportButtonProps {
  exportType: ExportType;
  title?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export function ExportButton({
  exportType,
  title,
  variant = 'outline',
  size = 'default',
  className,
}: ExportButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Download className="h-4 w-4 mr-2" />
        Export
      </Button>

      <ExportDialog
        open={open}
        onOpenChange={setOpen}
        exportType={exportType}
        title={title}
      />
    </>
  );
}
