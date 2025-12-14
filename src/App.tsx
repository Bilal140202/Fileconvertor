import { useEffect } from 'react';
import { DropZone } from '@/components/DropZone';
import { JobList } from '@/components/JobList';
import { BatchControls } from '@/components/BatchControls';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import { useFileQueueStore } from '@/store/useFileQueueStore';
import { FileJob } from '@/types';

function App() {
  const { toast } = useToast();
  const jobs = useFileQueueStore((state) => state.jobs);
  const updateStatus = useFileQueueStore((state) => state.updateStatus);
  const updateJob = useFileQueueStore((state) => state.updateJob);

  // Mock conversion handler
  const handleConvert = async (job: FileJob) => {
    return new Promise<void>((resolve) => {
      // Simulate conversion
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        updateJob(job.id, { progress });
        
        if (progress >= 100) {
          clearInterval(interval);
          resolve();
        }
      }, 200); // 2 seconds per file approx
    });
  };

  // Processor effect
  useEffect(() => {
    const processNext = async () => {
      // Find a queued job
      const nextJob = jobs.find((j) => j.status === 'queued');
      const processingJob = jobs.find((j) => j.status === 'processing');

      if (nextJob && !processingJob) {
        updateStatus(nextJob.id, 'processing');
        try {
          await handleConvert(nextJob);
          updateStatus(nextJob.id, 'completed');
          toast({
            title: "Conversion Complete",
            description: `File ${nextJob.name} converted successfully.`,
          });
        } catch (error) {
          console.error(error);
          updateJob(nextJob.id, { status: 'error', error: 'Conversion failed' });
          toast({
             variant: "destructive",
             title: "Conversion Failed",
             description: `File ${nextJob.name} failed to convert.`,
          });
        }
      }
    };
    
    processNext();
  }, [jobs, updateStatus, updateJob, toast]);

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6">File Queue Uploader</h1>
      
      <div className="space-y-6">
        <DropZone />
        
        <BatchControls />
        
        <JobList />
      </div>
      
      <Toaster />
    </div>
  );
}

export default App;
