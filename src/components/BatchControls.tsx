import { useFileQueueStore } from '@/store/useFileQueueStore';
import { Button } from '@/components/ui/button';
import { Play, Pause, Trash2 } from 'lucide-react';

export function BatchControls() {
  const startQueue = useFileQueueStore((state) => state.startQueue);
  const cancelQueue = useFileQueueStore((state) => state.cancelQueue);
  const clearQueue = useFileQueueStore((state) => state.clearQueue);
  const jobs = useFileQueueStore((state) => state.jobs);
  
  const hasJobs = jobs.length > 0;
  const isProcessing = jobs.some(j => j.status === 'processing');
  
  return (
    <div className="flex gap-2 mt-4 flex-wrap">
       <Button onClick={startQueue} disabled={!hasJobs || isProcessing}>
          <Play className="mr-2 h-4 w-4" /> Start Queue
       </Button>
       
       <Button onClick={cancelQueue} variant="secondary" disabled={!isProcessing}>
          <Pause className="mr-2 h-4 w-4" /> Stop/Cancel
       </Button>
       
       <Button onClick={clearQueue} variant="destructive" disabled={!hasJobs}>
          <Trash2 className="mr-2 h-4 w-4" /> Clear All
       </Button>
    </div>
  )
}
